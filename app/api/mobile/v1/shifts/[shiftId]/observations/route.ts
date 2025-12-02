import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { ModuleType } from '@/generated/prisma/client/enums'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ shiftId: string }> }
) {
    // Authenticate request
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { shiftId } = await params

        // Verify shift access
        const shift = await prisma.shift.findFirst({
            where: {
                id: shiftId,
                organisationId: context!.organisationId,
                shiftWorkerLink: {
                    some: {
                        workerId: context!.userId
                    }
                }
            }
        })

        if (!shift) {
            return errorResponse('Shift not found or access denied', 'NOT_FOUND', 404)
        }

        // Get all observations for this shift
        const observations = await prisma.observation.findMany({
            where: {
                progressNote: {
                    shiftId
                }
            },
            orderBy: { recordedAt: 'desc' }
        })

        return successResponse({
            observations: observations.map(obs => ({
                id: obs.id,
                type: obs.type,
                data: obs.data,
                recordedAt: obs.recordedAt.toISOString()
            }))
        })

    } catch (err) {
        console.error('Error fetching observations:', err)
        return errorResponse('Failed to fetch observations', 'INTERNAL_ERROR', 500)
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ shiftId: string }> }
) {
    // Authenticate request
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { shiftId } = await params
        const body = await request.json()
        const { moduleType, data, recordedAt } = body

        // Validate input
        if (!moduleType || !data) {
            return errorResponse('Missing required fields: moduleType, data', 'INVALID_INPUT', 400)
        }

        if (!Object.values(ModuleType).includes(moduleType)) {
            return errorResponse('Invalid module type', 'INVALID_INPUT', 400)
        }

        // Verify shift access and get client
        const shift = await prisma.shift.findFirst({
            where: {
                id: shiftId,
                organisationId: context!.organisationId,
                shiftWorkerLink: {
                    some: {
                        workerId: context!.userId
                    }
                }
            },
            include: {
                shiftClientLink: {
                    take: 1
                }
            }
        })

        if (!shift) {
            return errorResponse('Shift not found or access denied', 'NOT_FOUND', 404)
        }

        const clientId = shift.shiftClientLink[0]?.clientId
        if (!clientId) {
            return errorResponse('No client associated with this shift', 'INVALID_STATE', 400)
        }

        // Find or create progress note for this shift
        let note = await prisma.progressNote.findFirst({
            where: {
                shiftId,
                authorId: context!.userId
            },
            orderBy: { createdAt: 'desc' }
        })

        if (!note) {
            note = await prisma.progressNote.create({
                data: {
                    organisationId: context!.organisationId,
                    clientId: clientId,
                    shiftId,
                    authorId: context!.userId,
                    noteText: "Clinical Observation Recorded"
                }
            })
        }

        // Extract recordedAt from data if provided
        const { recordedAt: dataRecordedAt, ...dataWithoutRecordedAt } = data as any
        const observationTime = recordedAt || dataRecordedAt ? new Date(recordedAt || dataRecordedAt) : new Date()

        // Create observation
        const observation = await prisma.observation.create({
            data: {
                progressNoteId: note.id,
                type: moduleType,
                data: dataWithoutRecordedAt,
                recordedAt: observationTime
            }
        })

        return successResponse({
            observation: {
                id: observation.id,
                type: observation.type,
                data: observation.data,
                recordedAt: observation.recordedAt.toISOString()
            }
        }, 201)

    } catch (err) {
        console.error('Error creating observation:', err)
        return errorResponse('Failed to create observation', 'INTERNAL_ERROR', 500)
    }
}
