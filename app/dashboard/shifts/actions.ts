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

        const shiftsData = await prisma.shift.findMany({
            where: { organisationId: membership.organisationId },
            include: {
                shiftClientLink: {
                    include: {
                        client: { select: { name: true, ndisNumber: true } }
                    }
                },
                shiftWorkerLink: {
                    include: {
                        worker: { select: { name: true, email: true } }
                    }
                },
                createdBy: { select: { name: true } }
            },
            orderBy: { startTime: 'desc' }
        })

        const shifts = shiftsData.map(shift => ({
            ...shift,
            client: shift.shiftClientLink[0]?.client || { name: 'Unknown', ndisNumber: '' },
            worker: shift.shiftWorkerLink[0]?.worker || { name: 'Unknown', email: '' },
            clientId: shift.shiftClientLink[0]?.clientId || null,
            workerId: shift.shiftWorkerLink[0]?.workerId || null
        }))

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

        const shiftsData = await prisma.shift.findMany({
            where: {
                organisationId: membership.organisationId,
                shiftWorkerLink: {
                    some: { workerId: session.user.id }
                }
            },
            include: {
                shiftClientLink: {
                    include: {
                        client: { select: { name: true, ndisNumber: true } }
                    }
                },
                shiftWorkerLink: {
                    include: {
                        worker: { select: { name: true, email: true } }
                    }
                },
                progressNotes: {
                    select: { id: true }
                }
            },
            orderBy: { startTime: 'desc' }
        })

        const shifts = shiftsData.map(shift => ({
            ...shift,
            client: shift.shiftClientLink[0]?.client || { name: 'Unknown', ndisNumber: '' },
            worker: shift.shiftWorkerLink[0]?.worker || { name: 'Unknown', email: '' },
            clientId: shift.shiftClientLink[0]?.clientId || null,
            workerId: shift.shiftWorkerLink[0]?.workerId || null
        }))

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

        const shiftData = await prisma.shift.findFirst({
            where: {
                id,
                organisationId: membership.organisationId
            },
            include: {
                shiftClientLink: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                name: true,
                                ndisNumber: true,
                                dateOfBirth: true
                            }
                        }
                    }
                },

                shiftWorkerLink: {
                    include: {
                        worker: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                site: {
                    include: {
                        clients: {
                            select: {
                                id: true,
                                name: true,
                                ndisNumber: true
                            }
                        }
                    }
                },
                appointments: {
                    include: {
                        client: { select: { name: true } },
                        site: { select: { name: true } }
                    },
                    orderBy: { startTime: 'asc' }
                },
                createdBy: {
                    select: { name: true }
                },
                progressNotes: {
                    include: {
                        author: {
                            select: { name: true }
                        },
                        observations: {
                            orderBy: { recordedAt: 'desc' }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!shiftData) {
            return { error: 'Shift not found' }
        }

        const shift = {
            ...shiftData,
            client: shiftData.shiftClientLink[0]?.client || null,
            worker: shiftData.shiftWorkerLink[0]?.worker || null,
            clientId: shiftData.shiftClientLink[0]?.clientId || null,
            workerId: shiftData.shiftWorkerLink[0]?.workerId || null
        }

        // Check if current user is the assigned worker
        const isAssignedWorker = shiftData.shiftWorkerLink.some(sw => sw.workerId === session.user.id)

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
        if (!([OrgRole.ORG_ADMIN, OrgRole.COORDINATOR] as OrgRole[]).includes(membership.role)) {
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
                shiftClientLink: {
                    create: { clientId, organisationId: membership.organisationId }
                },
                shiftWorkerLink: {
                    create: { workerId, organisationId: membership.organisationId }
                },
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


const rosterShiftSchema = z.object({
    clientIds: z.array(z.string()).min(1, "At least one client is required"),
    workerIds: z.array(z.string()).min(1, "At least one worker is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    serviceType: z.string().optional(),
    location: z.string().optional()
})

export async function createRosterShift(prevState: any, formData: FormData) {
    try {
        const { membership, session } = await getOrgMembership()

        if (!([OrgRole.ORG_ADMIN, OrgRole.COORDINATOR] as OrgRole[]).includes(membership.role)) {
            return { error: 'Insufficient permissions to create shifts' }
        }

        const rawData = {
            clientIds: formData.getAll('clientIds'),
            workerIds: formData.getAll('workerIds'),
            startTime: formData.get('startTime'),
            endTime: formData.get('endTime'),
            serviceType: formData.get('serviceType'),
            location: formData.get('location')
        }

        const validated = rosterShiftSchema.safeParse(rawData)

        if (!validated.success) {
            const errors = validated.error.flatten().fieldErrors
            return { error: Object.values(errors)[0]?.[0] || 'Invalid input' }
        }

        const { clientIds, workerIds, startTime, endTime, serviceType, location } = validated.data

        // Verify clients
        const clients = await prisma.client.findMany({
            where: {
                id: { in: clientIds },
                organisationId: membership.organisationId
            }
        })

        if (clients.length !== clientIds.length) {
            return { error: 'One or more clients not found' }
        }

        // Verify workers
        const workers = await prisma.organisationMember.findMany({
            where: {
                userId: { in: workerIds },
                organisationId: membership.organisationId
            }
        })

        if (workers.length !== workerIds.length) {
            return { error: 'One or more workers not found' }
        }

        // Create shift with M-N relationships
        await prisma.shift.create({
            data: {
                organisationId: membership.organisationId,
                shiftClientLink: {
                    create: clientIds.map(clientId => ({
                        clientId,
                        organisationId: membership.organisationId
                    }))
                },
                shiftWorkerLink: {
                    create: workerIds.map(workerId => ({
                        workerId,
                        organisationId: membership.organisationId
                    }))
                },
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                serviceType: serviceType || null,
                location: location || null,
                status: ShiftStatus.PLANNED,
                createdById: session.user.id
            }
        })

        revalidatePath('/dashboard/shifts')
        revalidatePath('/dashboard/rostering/calendar')
        revalidatePath('/dashboard/my-shifts')

        return { success: true }

    } catch (error) {
        console.error('Failed to create roster shift:', error)
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
            },
            include: { shiftWorkerLink: true }
        })

        if (!shift) {
            return { error: 'Shift not found' }
        }

        // Check permissions: worker can update their own shifts, coordinators can update any
        const isAssignedWorker = shift.shiftWorkerLink.some(sw => sw.workerId === session.user.id)
        const isCoordinator = ([OrgRole.ORG_ADMIN, OrgRole.COORDINATOR] as OrgRole[]).includes(membership.role)

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

// Get shifts for a specific date range (for calendar view)
export async function getShiftsForDateRange(startDate: Date, endDate: Date) {
    try {
        const { membership } = await getOrgMembership()

        const shiftsData = await prisma.shift.findMany({
            where: {
                organisationId: membership.organisationId,
                startTime: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                shiftClientLink: { include: { client: { select: { id: true, name: true, ndisNumber: true } } } },
                shiftWorkerLink: { include: { worker: { select: { id: true, name: true, email: true } } } },
                createdBy: { select: { name: true } }
            },
            orderBy: { startTime: 'asc' }
        })

        const shifts = shiftsData.map(shift => ({
            ...shift,
            client: shift.shiftClientLink[0]?.client || { name: 'Unknown', ndisNumber: '' },
            worker: shift.shiftWorkerLink[0]?.worker || { name: 'Unknown', email: '' },
            clientId: shift.shiftClientLink[0]?.clientId || null,
            workerId: shift.shiftWorkerLink[0]?.workerId || null,
            validationStatus: shift.validationStatus // Ensure this is passed explicitly if needed, though ...shift covers it
        }))

        return { shifts }
    } catch (error) {
        console.error('Failed to fetch shifts for date range:', error)
        return { error: 'Failed to fetch shifts' }
    }
}

// Update shift times (for drag-and-drop on calendar)
export async function updateShiftTimes(shiftId: string, startTime: Date, endTime: Date) {
    try {
        const { membership } = await getOrgMembership()

        // Permission check - only coordinators and admins can modify shift times
        if (!([OrgRole.ORG_ADMIN, OrgRole.COORDINATOR] as OrgRole[]).includes(membership.role)) {
            return { error: 'Insufficient permissions to modify shifts' }
        }

        // Validate times
        if (endTime <= startTime) {
            return { error: 'End time must be after start time' }
        }

        // Get the shift to verify it belongs to the organization
        const shift = await prisma.shift.findFirst({
            where: {
                id: shiftId,
                organisationId: membership.organisationId
            }
        })

        if (!shift) {
            return { error: 'Shift not found' }
        }

        // Update shift times
        await prisma.shift.update({
            where: { id: shiftId },
            data: {
                startTime,
                endTime
            }
        })

        revalidatePath('/dashboard/shifts')
        revalidatePath('/dashboard/shifts/calendar')
        revalidatePath('/dashboard/my-shifts')
        revalidatePath(`/dashboard/shifts/${shiftId}`)

        return { success: true }
    } catch (error) {
        console.error('Failed to update shift times:', error)
        return { error: 'Failed to update shift times' }
    }
}

// Reassign shift to a different worker (for drag-and-drop on calendar)
export async function reassignShiftWorker(shiftId: string, newWorkerId: string) {
    try {
        const { membership } = await getOrgMembership()

        // Permission check - only coordinators and admins can reassign shifts
        if (!([OrgRole.ORG_ADMIN, OrgRole.COORDINATOR] as OrgRole[]).includes(membership.role)) {
            return { error: 'Insufficient permissions to reassign shifts' }
        }

        // Get the shift to verify it belongs to the organization
        const shift = await prisma.shift.findFirst({
            where: {
                id: shiftId,
                organisationId: membership.organisationId
            }
        })

        if (!shift) {
            return { error: 'Shift not found' }
        }

        // Verify new worker is a member of the organization
        const workerMembership = await prisma.organisationMember.findFirst({
            where: {
                userId: newWorkerId,
                organisationId: membership.organisationId
            }
        })

        if (!workerMembership) {
            return { error: 'Worker not found in your organization' }
        }

        // Update shift worker - replace existing workers with new one
        // First delete existing links
        await prisma.shiftWorker.deleteMany({
            where: { shiftId }
        })

        // Then create new link
        await prisma.shiftWorker.create({
            data: {
                shiftId,
                workerId: newWorkerId,
                organisationId: membership.organisationId
            }
        })

        revalidatePath('/dashboard/shifts')
        revalidatePath('/dashboard/shifts/calendar')
        revalidatePath('/dashboard/my-shifts')
        revalidatePath(`/dashboard/shifts/${shiftId}`)

        return { success: true }
    } catch (error) {
        console.error('Failed to reassign shift worker:', error)
        return { error: 'Failed to reassign shift worker' }
    }
}


// Save an observation (creates a progress note if one doesn't exist for the shift)
export async function saveObservation(shiftId: string, observationData: { moduleType: any, data: any }, clientId?: string) {
    try {
        const { membership, session } = await getOrgMembership()

        // Get shift
        const shift = await prisma.shift.findFirst({
            where: { id: shiftId, organisationId: membership.organisationId },
            include: {
                shiftClientLink: { include: { client: true } },
                shiftWorkerLink: true
            }
        })

        if (!shift) {
            return { error: 'Shift not found' }
        }

        // Check if user is assigned worker or coordinator
        const isAssignedWorker = shift.shiftWorkerLink.some(sw => sw.workerId === session.user.id)
        const isCoordinator = ([OrgRole.ORG_ADMIN, OrgRole.COORDINATOR] as OrgRole[]).includes(membership.role)

        if (!isAssignedWorker && !isCoordinator) {
            return { error: 'Insufficient permissions' }
        }

        // Find or create progress note for this shift/author
        let note = await prisma.progressNote.findFirst({
            where: {
                shiftId,
                authorId: session.user.id
            },
            orderBy: { createdAt: 'desc' }
        })

        if (!note) {
            const targetClientId = shift.shiftClientLink[0]?.clientId || clientId

            if (!targetClientId) {
                return { error: 'Client ID is required for this observation' }
            }

            note = await prisma.progressNote.create({
                data: {
                    organisationId: membership.organisationId,
                    clientId: targetClientId,
                    shiftId,
                    authorId: session.user.id,
                    noteText: "Clinical Observation Recorded",
                }
            })
        }

        // Extract recordedAt from the data if provided, otherwise use current time
        const { recordedAt, ...dataWithoutRecordedAt } = observationData.data as any
        const observationTime = recordedAt ? new Date(recordedAt) : new Date()

        // Create observation
        await prisma.observation.create({
            data: {
                progressNoteId: note.id,
                type: observationData.moduleType,
                data: dataWithoutRecordedAt,
                recordedAt: observationTime
            }
        })

        revalidatePath(`/dashboard/shifts/${shiftId}`)
        return { success: true }

    } catch (error) {
        console.error('Failed to save observation:', error)
        return { error: 'Failed to save observation' }
    }
}
