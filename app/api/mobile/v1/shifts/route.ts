import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { ShiftStatus } from '@/generated/prisma/client/enums'

export async function GET(request: NextRequest) {
    // Authenticate request
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        // Get query parameters
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const status = searchParams.get('status') as ShiftStatus | null

        // Build where clause
        const where: any = {
            organisationId: context!.organisationId,
            shiftWorkerLink: {
                some: {
                    workerId: context!.userId
                }
            }
        }

        // Add date filters if provided
        if (startDate || endDate) {
            where.startTime = {}
            if (startDate) where.startTime.gte = new Date(startDate)
            if (endDate) where.startTime.lte = new Date(endDate)
        }

        // Add status filter if provided
        if (status && Object.values(ShiftStatus).includes(status)) {
            where.status = status
        }

        // Fetch shifts
        const shifts = await prisma.shift.findMany({
            where,
            include: {
                shiftClientLink: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                name: true,
                                ndisNumber: true
                            }
                        }
                    }
                },
                progressNotes: {
                    select: { id: true }
                },
                _count: {
                    select: {
                        progressNotes: true
                    }
                }
            },
            orderBy: { startTime: 'asc' }
        })

        // Get observation counts for each shift
        const shiftsWithCounts = await Promise.all(
            shifts.map(async (shift) => {
                const observationsCount = await prisma.observation.count({
                    where: {
                        progressNote: {
                            shiftId: shift.id
                        }
                    }
                })

                return {
                    id: shift.id,
                    client: shift.shiftClientLink[0]?.client || null,
                    startTime: shift.startTime.toLocaleString('sv-SE').replace(' ', 'T'),
                    endTime: shift.endTime.toLocaleString('sv-SE').replace(' ', 'T'),
                    status: shift.status,
                    serviceType: shift.serviceType,
                    location: shift.location,
                    progressNotesCount: shift._count.progressNotes,
                    observationsCount
                }
            })
        )

        return successResponse({ shifts: shiftsWithCounts })

    } catch (err) {
        console.error('Error fetching shifts:', err)
        return errorResponse('Failed to fetch shifts', 'INTERNAL_ERROR', 500)
    }
}
