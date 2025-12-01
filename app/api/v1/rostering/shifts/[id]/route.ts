import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { ShiftStatus } from '@/generated/prisma/client/enums'
import type { UpdateShiftDto, ShiftResponseDto } from '@/lib/rostering/types'

/**
 * GET /api/v1/rostering/shifts/[id]
 * Get detailed shift information
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { id } = await params

        const shift = await prisma.shift.findFirst({
            where: {
                id,
                organisationId: context!.organisationId
            },
            include: {
                shiftWorkerLink: {
                    include: {
                        worker: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                qualifications: true
                            }
                        }
                    }
                },
                shiftClientLink: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                name: true,
                                ndisNumber: true,
                                enabledModules: {
                                    where: { isEnabled: true },
                                    select: { moduleType: true }
                                }
                            }
                        }
                    }
                },
                site: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                    }
                },
                _count: {
                    select: {
                        progressNotes: true
                    }
                }
            }
        })

        if (!shift) {
            return errorResponse('Shift not found', 'NOT_FOUND', 404)
        }

        const observationsCount = await prisma.observation.count({
            where: {
                progressNote: {
                    shiftId: shift.id
                }
            }
        })

        const response: ShiftResponseDto = {
            id: shift.id,
            startTime: shift.startTime.toISOString(),
            endTime: shift.endTime.toISOString(),
            status: shift.status,
            serviceType: shift.serviceType,
            location: shift.location,
            workers: shift.shiftWorkerLink.map(sw => ({
                id: sw.worker.id,
                name: sw.worker.name,
                email: sw.worker.email,
                qualifications: sw.worker.qualifications
            })),
            clients: shift.shiftClientLink.map(sc => ({
                id: sc.client.id,
                name: sc.client.name,
                ndisNumber: sc.client.ndisNumber,
                enabledModules: sc.client.enabledModules.map(m => m.moduleType)
            })),
            site: shift.site,
            clockInTime: shift.clockInTime?.toISOString() || null,
            clockOutTime: shift.clockOutTime?.toISOString() || null,
            progressNotesCount: shift._count.progressNotes,
            observationsCount
        }

        return successResponse({ shift: response })
    } catch (err) {
        console.error('Error fetching shift:', err)
        return errorResponse('Failed to fetch shift', 'INTERNAL_ERROR', 500)
    }
}

/**
 * PUT /api/v1/rostering/shifts/[id]
 * Update shift details including workers and clients
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { id } = await params
        const body: UpdateShiftDto = await request.json()

        // Verify shift exists and belongs to organization
        const existingShift = await prisma.shift.findFirst({
            where: {
                id,
                organisationId: context!.organisationId
            }
        })

        if (!existingShift) {
            return errorResponse('Shift not found', 'NOT_FOUND', 404)
        }

        // Validate dates if provided
        if (body.startTime && body.endTime) {
            const startTime = new Date(body.startTime)
            const endTime = new Date(body.endTime)
            if (startTime >= endTime) {
                return errorResponse('End time must be after start time', 'VALIDATION_ERROR', 400)
            }
        }

        // Validate workers if provided
        if (body.workerIds && body.workerIds.length > 0) {
            const workers = await prisma.user.findMany({
                where: {
                    id: { in: body.workerIds },
                    organisationMemberships: {
                        some: {
                            organisationId: context!.organisationId
                        }
                    }
                }
            })

            if (workers.length !== body.workerIds.length) {
                return errorResponse('One or more workers not found', 'NOT_FOUND', 404)
            }
        }

        // Validate clients if provided
        if (body.clientIds && body.clientIds.length > 0) {
            const clients = await prisma.client.findMany({
                where: {
                    id: { in: body.clientIds },
                    organisationId: context!.organisationId
                }
            })

            if (clients.length !== body.clientIds.length) {
                return errorResponse('One or more clients not found', 'NOT_FOUND', 404)
            }
        }

        // Validate site if provided
        if (body.siteId) {
            const site = await prisma.site.findFirst({
                where: {
                    id: body.siteId,
                    organisationId: context!.organisationId
                }
            })

            if (!site) {
                return errorResponse('Site not found', 'NOT_FOUND', 404)
            }
        }

        // Update shift
        const updateData: any = {}
        if (body.startTime) updateData.startTime = new Date(body.startTime)
        if (body.endTime) updateData.endTime = new Date(body.endTime)
        if (body.status) updateData.status = body.status
        if (body.serviceType !== undefined) updateData.serviceType = body.serviceType
        if (body.location !== undefined) updateData.location = body.location
        if (body.siteId !== undefined) updateData.siteId = body.siteId

        const shift = await prisma.$transaction(async (tx) => {
            // Update worker assignments if provided
            if (body.workerIds) {
                // Delete existing worker links
                await tx.shiftWorker.deleteMany({
                    where: { shiftId: id }
                })

                // Create new worker links
                if (body.workerIds.length > 0) {
                    await tx.shiftWorker.createMany({
                        data: body.workerIds.map(workerId => ({
                            shiftId: id,
                            workerId,
                            organisationId: context!.organisationId
                        }))
                    })
                }
            }

            // Update client assignments if provided
            if (body.clientIds) {
                // Delete existing client links
                await tx.shiftClient.deleteMany({
                    where: { shiftId: id }
                })

                // Create new client links
                if (body.clientIds.length > 0) {
                    await tx.shiftClient.createMany({
                        data: body.clientIds.map(clientId => ({
                            shiftId: id,
                            clientId,
                            organisationId: context!.organisationId
                        }))
                    })
                }
            }

            // Update shift details
            return await tx.shift.update({
                where: { id },
                data: updateData,
                include: {
                    shiftWorkerLink: {
                        include: {
                            worker: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    qualifications: true
                                }
                            }
                        }
                    },
                    shiftClientLink: {
                        include: {
                            client: {
                                select: {
                                    id: true,
                                    name: true,
                                    ndisNumber: true,
                                    enabledModules: {
                                        where: { isEnabled: true },
                                        select: { moduleType: true }
                                    }
                                }
                            }
                        }
                    },
                    site: {
                        select: {
                            id: true,
                            name: true,
                            address: true
                        }
                    }
                }
            })
        })

        const response: ShiftResponseDto = {
            id: shift.id,
            startTime: shift.startTime.toISOString(),
            endTime: shift.endTime.toISOString(),
            status: shift.status,
            serviceType: shift.serviceType,
            location: shift.location,
            workers: shift.shiftWorkerLink.map(sw => ({
                id: sw.worker.id,
                name: sw.worker.name,
                email: sw.worker.email,
                qualifications: sw.worker.qualifications
            })),
            clients: shift.shiftClientLink.map(sc => ({
                id: sc.client.id,
                name: sc.client.name,
                ndisNumber: sc.client.ndisNumber,
                enabledModules: sc.client.enabledModules.map(m => m.moduleType)
            })),
            site: shift.site,
            clockInTime: shift.clockInTime?.toISOString() || null,
            clockOutTime: shift.clockOutTime?.toISOString() || null
        }

        return successResponse({ shift: response })
    } catch (err) {
        console.error('Error updating shift:', err)
        return errorResponse('Failed to update shift', 'INTERNAL_ERROR', 500)
    }
}

/**
 * DELETE /api/v1/rostering/shifts/[id]
 * Delete a shift
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { id } = await params

        // Verify shift exists and belongs to organization
        const shift = await prisma.shift.findFirst({
            where: {
                id,
                organisationId: context!.organisationId
            }
        })

        if (!shift) {
            return errorResponse('Shift not found', 'NOT_FOUND', 404)
        }

        // Check if shift has already started/completed
        if (shift.status === ShiftStatus.IN_PROGRESS || shift.status === ShiftStatus.COMPLETED) {
            return errorResponse(
                'Cannot delete shift that has started or completed',
                'VALIDATION_ERROR',
                400
            )
        }

        // Delete shift (cascade will handle worker/client links)
        await prisma.shift.delete({
            where: { id }
        })

        return successResponse({ message: 'Shift deleted successfully' })
    } catch (err) {
        console.error('Error deleting shift:', err)
        return errorResponse('Failed to delete shift', 'INTERNAL_ERROR', 500)
    }
}
