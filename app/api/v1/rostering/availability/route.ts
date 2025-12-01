import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import type { CreateAvailabilityDto, AvailabilityResponseDto } from '@/lib/rostering/types'

/**
 * GET /api/v1/rostering/availability
 * Get worker availability for a date range
 */
export async function GET(request: NextRequest) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { searchParams } = new URL(request.url)
        const workerId = searchParams.get('workerId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Build where clause
        const where: any = {
            organisationId: context!.organisationId
        }

        if (workerId) {
            where.workerId = workerId
        }

        if (startDate || endDate) {
            where.date = {}
            if (startDate) where.date.gte = new Date(startDate)
            if (endDate) where.date.lte = new Date(endDate)
        }

        const availabilities = await prisma.workerAvailability.findMany({
            where,
            include: {
                worker: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: [
                { date: 'asc' },
                { startTime: 'asc' }
            ]
        })

        const response: AvailabilityResponseDto[] = availabilities.map(avail => ({
            id: avail.id,
            workerId: avail.workerId,
            workerName: avail.worker.name,
            date: avail.date.toISOString().split('T')[0],
            startTime: avail.startTime.toISOString(),
            endTime: avail.endTime.toISOString(),
            isAvailable: avail.isAvailable,
            notes: avail.notes
        }))

        return successResponse({ availability: response })
    } catch (err) {
        console.error('Error fetching availability:', err)
        return errorResponse('Failed to fetch availability', 'INTERNAL_ERROR', 500)
    }
}

/**
 * POST /api/v1/rostering/availability
 * Create or update worker availability (bulk)
 */
export async function POST(request: NextRequest) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const body: CreateAvailabilityDto | CreateAvailabilityDto[] = await request.json()
        const availabilityRecords = Array.isArray(body) ? body : [body]

        // Validate all records
        for (const record of availabilityRecords) {
            if (!record.workerId || !record.date || !record.startTime || !record.endTime) {
                return errorResponse(
                    'Missing required fields: workerId, date, startTime, and endTime are required',
                    'VALIDATION_ERROR',
                    400
                )
            }

            // Validate times
            const startTime = new Date(record.startTime)
            const endTime = new Date(record.endTime)
            if (startTime >= endTime) {
                return errorResponse('End time must be after start time', 'VALIDATION_ERROR', 400)
            }

            // Verify worker exists and belongs to organization
            const worker = await prisma.user.findFirst({
                where: {
                    id: record.workerId,
                    organisationMemberships: {
                        some: {
                            organisationId: context!.organisationId
                        }
                    }
                }
            })

            if (!worker) {
                return errorResponse(`Worker ${record.workerId} not found`, 'NOT_FOUND', 404)
            }
        }

        // Create availability records using upsert to handle duplicates
        const created = await Promise.all(
            availabilityRecords.map(async (record) => {
                const date = new Date(record.date)
                const startTime = new Date(record.startTime)

                return await prisma.workerAvailability.upsert({
                    where: {
                        organisationId_workerId_date_startTime: {
                            organisationId: context!.organisationId,
                            workerId: record.workerId,
                            date,
                            startTime
                        }
                    },
                    update: {
                        endTime: new Date(record.endTime),
                        isAvailable: record.isAvailable ?? true,
                        notes: record.notes
                    },
                    create: {
                        organisationId: context!.organisationId,
                        workerId: record.workerId,
                        date,
                        startTime,
                        endTime: new Date(record.endTime),
                        isAvailable: record.isAvailable ?? true,
                        notes: record.notes
                    },
                    include: {
                        worker: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                })
            })
        )

        const response: AvailabilityResponseDto[] = created.map(avail => ({
            id: avail.id,
            workerId: avail.workerId,
            workerName: avail.worker.name,
            date: avail.date.toISOString().split('T')[0],
            startTime: avail.startTime.toISOString(),
            endTime: avail.endTime.toISOString(),
            isAvailable: avail.isAvailable,
            notes: avail.notes
        }))

        return successResponse({ availability: response }, 201)
    } catch (err) {
        console.error('Error creating availability:', err)
        return errorResponse('Failed to create availability', 'INTERNAL_ERROR', 500)
    }
}
