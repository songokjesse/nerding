import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { ShiftStatus } from '@/generated/prisma/client/enums'
import type { CreateShiftDto, ShiftResponseDto } from '@/lib/rostering/types'

/**
 * GET /api/v1/rostering/shifts
 * List shifts with advanced filtering for rostering
 */
export async function GET(request: NextRequest) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const workerId = searchParams.get('workerId')
        const clientId = searchParams.get('clientId')
        const siteId = searchParams.get('siteId')
        const status = searchParams.get('status') as ShiftStatus | null

        // Build where clause
        const where: any = {
            organisationId: context!.organisationId
        }

        // Date filters
        if (startDate || endDate) {
            where.startTime = {}
            if (startDate) where.startTime.gte = new Date(startDate)
            if (endDate) where.startTime.lte = new Date(endDate)
        }

        // Status filter
        if (status && Object.values(ShiftStatus).includes(status)) {
            where.status = status
        }

        // Site filter
        if (siteId) {
            where.siteId = siteId
        }

        // Worker filter (via join table)
        if (workerId) {
            where.shiftWorkerLink = {
                some: {
                    workerId: workerId
                }
            }
        }

        // Client filter (via join table)
        if (clientId) {
            where.shiftClientLink = {
                some: {
                    clientId: clientId
                }
            }
        }

        // Fetch shifts with relationships
        const shifts = await prisma.shift.findMany({
            where,
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
            },
            orderBy: { startTime: 'asc' }
        })

        // Transform to response format
        const shiftsResponse: ShiftResponseDto[] = await Promise.all(
            shifts.map(async (shift) => {
                // Count observations
                const observationsCount = await prisma.observation.count({
                    where: {
                        progressNote: {
                            shiftId: shift.id
                        }
                    }
                })

                return {
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
            })
        )

        return successResponse({ shifts: shiftsResponse })
    } catch (err) {
        console.error('Error fetching rostering shifts:', err)
        return errorResponse('Failed to fetch shifts', 'INTERNAL_ERROR', 500)
    }
}

/**
 * POST /api/v1/rostering/shifts
 * Create a new shift with multiple workers and clients
 */
export async function POST(request: NextRequest) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const body: CreateShiftDto = await request.json()

        // Validate required fields
        if (!body.startTime || !body.endTime || !body.workerIds || body.workerIds.length === 0) {
            return errorResponse(
                'Missing required fields: startTime, endTime, and workerIds are required',
                'VALIDATION_ERROR',
                400
            )
        }

        // Validate dates
        const startTime = new Date(body.startTime)
        const endTime = new Date(body.endTime)
        if (startTime >= endTime) {
            return errorResponse('End time must be after start time', 'VALIDATION_ERROR', 400)
        }

        // Check that workers exist and belong to the organization
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

        // Check clients if provided
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

        // Check site if provided
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

        // Create shift with workers and clients
        const shift = await prisma.shift.create({
            data: {
                organisationId: context!.organisationId,
                startTime,
                endTime,
                status: body.status || ShiftStatus.PLANNED,
                serviceType: body.serviceType,
                location: body.location,
                siteId: body.siteId,
                createdById: context!.userId,
                // Create worker relationships
                shiftWorkerLink: {
                    create: body.workerIds.map(workerId => ({
                        workerId,
                        organisationId: context!.organisationId
                    }))
                },
                // Create client relationships if provided
                shiftClientLink: body.clientIds && body.clientIds.length > 0 ? {
                    create: body.clientIds.map(clientId => ({
                        clientId,
                        organisationId: context!.organisationId
                    }))
                } : undefined
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
            clockInTime: null,
            clockOutTime: null
        }

        return successResponse({ shift: response }, 201)
    } catch (err) {
        console.error('Error creating shift:', err)
        return errorResponse('Failed to create shift', 'INTERNAL_ERROR', 500)
    }
}
