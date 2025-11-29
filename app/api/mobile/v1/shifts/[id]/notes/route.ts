import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Authenticate request
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { id } = await params

        // Verify shift access
        const shift = await prisma.shift.findFirst({
            where: {
                id,
                organisationId: context!.organisationId,
                workerId: context!.userId
            }
        })

        if (!shift) {
            return errorResponse('Shift not found or access denied', 'NOT_FOUND', 404)
        }

        // Get all progress notes for this shift
        const notes = await prisma.progressNote.findMany({
            where: { shiftId: id },
            include: {
                author: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return successResponse({
            notes: notes.map(note => ({
                id: note.id,
                noteText: note.noteText,
                mood: note.mood,
                incidentFlag: note.incidentFlag,
                behavioursFlag: note.behavioursFlag,
                medicationFlag: note.medicationFlag,
                createdAt: note.createdAt.toISOString(),
                author: note.author
            }))
        })

    } catch (err) {
        console.error('Error fetching progress notes:', err)
        return errorResponse('Failed to fetch progress notes', 'INTERNAL_ERROR', 500)
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Authenticate request
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { id } = await params
        const body = await request.json()
        const { noteText, mood, incidentFlag, behavioursFlag, medicationFlag } = body

        // Validate input
        if (!noteText || noteText.trim().length === 0) {
            return errorResponse('Note text is required', 'INVALID_INPUT', 400)
        }

        // Verify shift access
        const shift = await prisma.shift.findFirst({
            where: {
                id,
                organisationId: context!.organisationId,
                workerId: context!.userId
            }
        })

        if (!shift) {
            return errorResponse('Shift not found or access denied', 'NOT_FOUND', 404)
        }

        // Determine client ID
        let targetClientId = shift.clientId
        if (!targetClientId) {
            if (!body.clientId) {
                return errorResponse('Client ID is required for this shift', 'INVALID_INPUT', 400)
            }
            targetClientId = body.clientId
        }

        // Create progress note
        const note = await prisma.progressNote.create({
            data: {
                organisationId: context!.organisationId,
                clientId: targetClientId!,
                shiftId: id,
                authorId: context!.userId,
                noteText: noteText.trim(),
                mood: mood || null,
                incidentFlag: incidentFlag || false,
                behavioursFlag: behavioursFlag || false,
                medicationFlag: medicationFlag || false
            },
            include: {
                author: {
                    select: {
                        name: true
                    }
                }
            }
        })

        return successResponse({
            note: {
                id: note.id,
                noteText: note.noteText,
                mood: note.mood,
                incidentFlag: note.incidentFlag,
                behavioursFlag: note.behavioursFlag,
                medicationFlag: note.medicationFlag,
                createdAt: note.createdAt.toISOString(),
                author: note.author
            }
        }, 201)

    } catch (err) {
        console.error('Error creating progress note:', err)
        return errorResponse('Failed to create progress note', 'INTERNAL_ERROR', 500)
    }
}
