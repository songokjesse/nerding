'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { OrgRole, ShiftStatus } from '@/generated/prisma/client/enums'

// Schema for shift validation
const shiftSchema = z.object({
    clientId: z.string().min(1, "Client is required"),
    workerId: z.string().min(1, "Worker is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    serviceType: z.string().optional(),
    location: z.string().optional()
})

// Helper to get current user's org membership
async function getOrgMembership() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user) {
        throw new Error('Not authenticated')
    }

    const membership = await prisma.organisationMember.findFirst({
        where: { userId: session.user.id },
        include: { organisation: true }
    })

    if (!membership) {
        throw new Error('No organisation membership found')
    }

    return { session, membership }
}

// Get all shifts for organization (coordinators)
export async function getShifts() {
    try {
        const { membership } = await getOrgMembership()

        const shifts = await prisma.shift.findMany({
            where: { organisationId: membership.organisationId },
            include: {
                client: { select: { name: true, ndisNumber: true } },
                worker: { select: { name: true, email: true } },
                createdBy: { select: { name: true } }
            },
            orderBy: { startTime: 'desc' }
        })

        return { shifts }
    } catch (error) {
        console.error('Failed to fetch shifts:', error)
        return { error: 'Failed to fetch shifts' }
    }
}

// Get shifts assigned to current worker
export async function getMyShifts() {
    try {
        const { session, membership } = await getOrgMembership()

        const shifts = await prisma.shift.findMany({
            where: {
                organisationId: membership.organisationId,
                workerId: session.user.id
            },
            include: {
                client: { select: { name: true, ndisNumber: true } },
                worker: { select: { name: true, email: true } },
                progressNotes: {
                    select: { id: true }
                }
            },
            orderBy: { startTime: 'desc' }
        })

        return { shifts }
    } catch (error) {
        console.error('Failed to fetch my shifts:', error)
        return { error: 'Failed to fetch your shifts' }
    }
}

// Get single shift with details
export async function getShift(id: string) {
    try {
        const { membership, session } = await getOrgMembership()

        const shift = await prisma.shift.findFirst({
            where: {
                id,
                organisationId: membership.organisationId
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        ndisNumber: true,
                        dateOfBirth: true
                    }
                },
                worker: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                createdBy: {
                    select: { name: true }
                },
                progressNotes: {
                    include: {
                        author: {
                            select: { name: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!shift) {
            return { error: 'Shift not found' }
        }

        // Check if current user is the assigned worker
        const isAssignedWorker = shift.workerId === session.user.id

        return { shift, isAssignedWorker }
    } catch (error) {
        console.error('Failed to fetch shift:', error)
        return { error: 'Failed to fetch shift' }
    }
}

// Create new shift (coordinators only)
export async function createShift(prevState: any, formData: FormData) {
    try {
        const { membership, session } = await getOrgMembership()

        // Role check - only coordinators and admins can create shifts
        if (![OrgRole.ORG_ADMIN, OrgRole.COORDINATOR].includes(membership.role)) {
            return { error: 'Insufficient permissions to create shifts' }
        }

        const rawData = {
            clientId: formData.get('clientId'),
            workerId: formData.get('workerId'),
            startTime: formData.get('startTime'),
            endTime: formData.get('endTime'),
            serviceType: formData.get('serviceType'),
            location: formData.get('location')
        }

        const validated = shiftSchema.safeParse(rawData)

        if (!validated.success) {
            const errors = validated.error.flatten().fieldErrors
            return { error: Object.values(errors)[0]?.[0] || 'Invalid input' }
        }

        const { clientId, workerId, startTime, endTime, serviceType, location } = validated.data

        // Verify client belongs to organization
        const client = await prisma.client.findFirst({
            where: { id: clientId, organisationId: membership.organisationId }
        })

        if (!client) {
            return { error: 'Client not found in your organization' }
        }

        // Verify worker is a member of organization
        const workerMembership = await prisma.organisationMember.findFirst({
            where: {
                userId: workerId,
                organisationId: membership.organisationId
            }
        })

        if (!workerMembership) {
            return { error: 'Worker not found in your organization' }
        }

        // Create shift
        await prisma.shift.create({
            data: {
                organisationId: membership.organisationId,
                clientId,
                workerId,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                serviceType: serviceType || null,
                location: location || null,
                status: ShiftStatus.PLANNED,
                createdById: session.user.id
            }
        })

        revalidatePath('/dashboard/shifts')
        revalidatePath('/dashboard/my-shifts')
        redirect('/dashboard/shifts')

    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        console.error('Failed to create shift:', error)
        return { error: 'Failed to create shift' }
    }
}

// Update shift status
export async function updateShiftStatus(shiftId: string, status: ShiftStatus) {
    try {
        const { membership, session } = await getOrgMembership()

        // Get the shift
        const shift = await prisma.shift.findFirst({
            where: {
                id: shiftId,
                organisationId: membership.organisationId
            }
        })

        if (!shift) {
            return { error: 'Shift not found' }
        }

        // Check permissions: worker can update their own shifts, coordinators can update any
        const isAssignedWorker = shift.workerId === session.user.id
        const isCoordinator = [OrgRole.ORG_ADMIN, OrgRole.COORDINATOR].includes(membership.role)

        if (!isAssignedWorker && !isCoordinator) {
            return { error: 'Insufficient permissions to update this shift' }
        }

        // Update status
        await prisma.shift.update({
            where: { id: shiftId },
            data: { status }
        })

        revalidatePath('/dashboard/shifts')
        revalidatePath('/dashboard/my-shifts')
        revalidatePath(`/dashboard/shifts/${shiftId}`)

        return { success: true }
    } catch (error) {
        console.error('Failed to update shift status:', error)
        return { error: 'Failed to update shift status' }
    }
}

// Get organization members for worker selection
export async function getOrganizationWorkers() {
    try {
        const { membership } = await getOrgMembership()

        const members = await prisma.organisationMember.findMany({
            where: { organisationId: membership.organisationId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                user: { name: 'asc' }
            }
        })

        return { workers: members.map(m => m.user) }
    } catch (error) {
        console.error('Failed to fetch workers:', error)
        return { error: 'Failed to fetch workers' }
    }
}
