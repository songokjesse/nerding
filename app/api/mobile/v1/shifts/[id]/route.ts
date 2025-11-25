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

        // Fetch shift with full details
        const shift = await prisma.shift.findFirst({
            where: {
                id,
                organisationId: context!.organisationId,
                workerId: context!.userId // Only worker's own shifts
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        ndisNumber: true,
                        dateOfBirth: true,
                        notes: true
                    }
                },
                progressNotes: {
                    include: {
                        author: {
                            select: {
                                name: true
                            }
                        },
                        observations: {
                            orderBy: { recordedAt: 'desc' }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!shift) {
            return errorResponse('Shift not found or access denied', 'NOT_FOUND', 404)
        }

        // Get enabled modules for the client
        const modules = await prisma.clientModule.findMany({
            where: {
                clientId: shift.clientId,
                isEnabled: true
            },
            select: {
                moduleType: true
            }
        })

        // Extract all observations from progress notes
        const allObservations = shift.progressNotes
            .flatMap(note => note.observations || [])
            .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())

        return successResponse({
            shift: {
                id: shift.id,
                client: {
                    ...shift.client,
                    dateOfBirth: shift.client.dateOfBirth?.toISOString(),
                    enabledModules: modules.map(m => m.moduleType)
                },
                startTime: shift.startTime.toISOString(),
                endTime: shift.endTime.toISOString(),
                status: shift.status,
                serviceType: shift.serviceType,
                location: shift.location,
                clockInTime: shift.clockInTime?.toISOString(),
                clockOutTime: shift.clockOutTime?.toISOString(),
                clockInLocation: shift.clockInLocation,
                clockOutLocation: shift.clockOutLocation,
                progressNotes: shift.progressNotes.map(note => ({
                    id: note.id,
                    noteText: note.noteText,
                    mood: note.mood,
                    incidentFlag: note.incidentFlag,
                    behavioursFlag: note.behavioursFlag,
                    medicationFlag: note.medicationFlag,
                    createdAt: note.createdAt.toISOString(),
                    author: note.author
                })),
                observations: allObservations.map(obs => ({
                    id: obs.id,
                    type: obs.type,
                    data: obs.data,
                    recordedAt: obs.recordedAt.toISOString()
                }))
            }
        })

    } catch (err) {
        console.error('Error fetching shift:', err)
        return errorResponse('Failed to fetch shift', 'INTERNAL_ERROR', 500)
    }
}
