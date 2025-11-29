'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Schema for progress note validation
const progressNoteSchema = z.object({
    noteText: z.string().min(10, "Note must be at least 10 characters"),
    incidentFlag: z.boolean().optional(),
    behavioursFlag: z.boolean().optional(),
    medicationFlag: z.boolean().optional(),
    mood: z.string().optional(),
    clientId: z.string().optional()
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

// Create progress note for a shift
export async function createProgressNote(shiftId: string, prevState: any, formData: FormData) {
    try {
        const { session, membership } = await getOrgMembership()

        // Get the shift and verify permissions
        const shift = await prisma.shift.findFirst({
            where: {
                id: shiftId,
                organisationId: membership.organisationId
            }
        })

        if (!shift) {
            return { error: 'Shift not found' }
        }

        // Check if user is the assigned worker or a coordinator
        const isAssignedWorker = shift.workerId === session.user.id
        const isCoordinator = membership.role === 'ORG_ADMIN' || membership.role === 'COORDINATOR'

        if (!isAssignedWorker && !isCoordinator) {
            return { error: 'You can only add notes to your own shifts' }
        }

        const rawData = {
            noteText: formData.get('noteText'),
            incidentFlag: formData.get('incidentFlag') === 'on',
            behavioursFlag: formData.get('behavioursFlag') === 'on',
            medicationFlag: formData.get('medicationFlag') === 'on',
            mood: formData.get('mood') || undefined,
            clientId: formData.get('clientId') || undefined
        }

        const validated = progressNoteSchema.safeParse(rawData)

        if (!validated.success) {
            const errors = validated.error.flatten().fieldErrors
            return { error: Object.values(errors)[0]?.[0] || 'Invalid input' }
        }

        const { noteText, incidentFlag, behavioursFlag, medicationFlag, mood, clientId } = validated.data

        const targetClientId = shift.clientId || clientId

        if (!targetClientId) {
            return { error: 'Client ID is required' }
        }

        // Create progress note
        await prisma.progressNote.create({
            data: {
                organisationId: membership.organisationId,
                clientId: targetClientId,
                shiftId: shift.id,
                authorId: session.user.id,
                noteText,
                incidentFlag: incidentFlag || false,
                behavioursFlag: behavioursFlag || false,
                medicationFlag: medicationFlag || false,
                mood: mood || null
            }
        })

        revalidatePath(`/dashboard/shifts/${shiftId}`)
        revalidatePath('/dashboard/my-shifts')
        revalidatePath(`/dashboard/clients/${shift.clientId}`)

        return { success: true }
    } catch (error) {
        console.error('Failed to create progress note:', error)
        return { error: 'Failed to create progress note' }
    }
}

// Get all notes for a client
export async function getClientNotes(clientId: string) {
    try {
        const { membership } = await getOrgMembership()

        const notes = await prisma.progressNote.findMany({
            where: {
                clientId,
                organisationId: membership.organisationId
            },
            include: {
                author: {
                    select: { name: true }
                },
                shift: {
                    select: {
                        id: true,
                        startTime: true,
                        endTime: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return { notes }
    } catch (error) {
        console.error('Failed to fetch client notes:', error)
        return { error: 'Failed to fetch notes' }
    }
}
