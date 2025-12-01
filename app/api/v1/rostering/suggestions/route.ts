import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { generateShiftSuggestions, detectSuggestionConflicts } from '@/lib/rostering/suggestions'
import type {
    RosterSuggestionRequestDto,
    RosterSuggestionResponseDto,
    WorkerWithAvailability,
    ClientWithNeeds
} from '@/lib/rostering/types'

/**
 * POST /api/v1/rostering/suggestions
 * Generate roster suggestions based on availability and preferences
 */
export async function POST(request: NextRequest) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const body: RosterSuggestionRequestDto = await request.json()

        if (!body.startDate || !body.endDate) {
            return errorResponse('startDate and endDate are required', 'VALIDATION_ERROR', 400)
        }

        // Get available workers
        const workerFilter: any = {
            organisationMemberships: {
                some: {
                    organisationId: context!.organisationId
                }
            }
        }

        if (body.workerIds && body.workerIds.length > 0) {
            workerFilter.id = { in: body.workerIds }
        }

        const workers = await prisma.user.findMany({
            where: workerFilter,
            select: {
                id: true,
                name: true,
                email: true,
                qualifications: true
            }
        })

        // Get worker availability for the period
        const startDate = new Date(body.startDate)
        const endDate = new Date(body.endDate)

        const availability = await prisma.workerAvailability.findMany({
            where: {
                organisationId: context!.organisationId,
                workerId: { in: workers.map(w => w.id) },
                date: {
                    gte: startDate,
                    lte: endDate
                }
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

        // Get assigned shifts count for each worker in this period
        const assignedShifts = await prisma.shift.findMany({
            where: {
                organisationId: context!.organisationId,
                startTime: {
                    gte: startDate,
                    lte: endDate
                },
                shiftWorkerLink: {
                    some: {
                        workerId: { in: workers.map(w => w.id) }
                    }
                }
            },
            include: {
                shiftWorkerLink: {
                    select: {
                        workerId: true
                    }
                }
            }
        })

        const workerShiftCounts = new Map<string, number>()
        assignedShifts.forEach(shift => {
            shift.shiftWorkerLink.forEach(sw => {
                workerShiftCounts.set(sw.workerId, (workerShiftCounts.get(sw.workerId) || 0) + 1)
            })
        })

        // Build WorkerWithAvailability array
        const workersWithAvailability: WorkerWithAvailability[] = workers.map(worker => ({
            id: worker.id,
            name: worker.name,
            email: worker.email,
            qualifications: worker.qualifications,
            availability: availability
                .filter(a => a.workerId === worker.id)
                .map(a => ({
                    id: a.id,
                    workerId: a.workerId,
                    workerName: a.worker.name,
                    date: a.date.toISOString().split('T')[0],
                    startTime: a.startTime.toISOString(),
                    endTime: a.endTime.toISOString(),
                    isAvailable: a.isAvailable,
                    notes: a.notes
                })),
            assignedShiftsCount: workerShiftCounts.get(worker.id) || 0
        }))

        // Get clients
        const clientFilter: any = {
            organisationId: context!.organisationId
        }

        if (body.clientIds && body.clientIds.length > 0) {
            clientFilter.id = { in: body.clientIds }
        }

        if (body.siteId) {
            clientFilter.siteId = body.siteId
        }

        const clients = await prisma.client.findMany({
            where: clientFilter,
            select: {
                id: true,
                name: true,
                ndisNumber: true,
                preferences: true,
                enabledModules: {
                    where: { isEnabled: true },
                    select: { moduleType: true }
                }
            }
        })

        // Build ClientWithNeeds array
        const clientsWithNeeds: ClientWithNeeds[] = clients.map(client => {
            const prefs = client.preferences as any || {}
            return {
                id: client.id,
                name: client.name,
                ndisNumber: client.ndisNumber,
                enabledModules: client.enabledModules.map(m => m.moduleType),
                requiredQualifications: prefs.requiredQualifications || [],
                preferredWorkers: prefs.preferredWorkers || [],
                excludedWorkers: prefs.excludedWorkers || []
            }
        })

        // Generate suggestions
        const suggestions = generateShiftSuggestions(
            body,
            workersWithAvailability,
            clientsWithNeeds
        )

        // Get existing shifts to check for conflicts
        const existingShifts = body.existingShiftIds && body.existingShiftIds.length > 0
            ? await prisma.shift.findMany({
                where: {
                    id: { in: body.existingShiftIds },
                    organisationId: context!.organisationId
                },
                include: {
                    shiftWorkerLink: {
                        select: { workerId: true }
                    },
                    shiftClientLink: {
                        select: { clientId: true }
                    }
                }
            }).then(shifts => shifts.map(s => ({
                id: s.id,
                startTime: s.startTime.toISOString(),
                endTime: s.endTime.toISOString(),
                workerIds: s.shiftWorkerLink.map(sw => sw.workerId),
                clientIds: s.shiftClientLink.map(sc => sc.clientId)
            })))
            : []

        // Detect conflicts
        const conflicts = detectSuggestionConflicts(suggestions, existingShifts)

        // Calculate metadata
        const workersUtilized = new Set(suggestions.flatMap(s => s.workerIds)).size
        const clientsCovered = new Set(suggestions.flatMap(s => s.clientIds)).size

        const response: RosterSuggestionResponseDto = {
            suggestions,
            conflicts,
            confidenceScore: suggestions.length > 0
                ? suggestions.reduce((sum, s) => sum + s.matchScore, 0) / (suggestions.length * 100)
                : 0,
            explanation: `Generated ${suggestions.length} shift suggestions for ${clientsCovered} clients using ${workersUtilized} workers`,
            metadata: {
                totalSuggestedShifts: suggestions.length,
                workersUtilized,
                clientsCovered
            }
        }

        return successResponse(response)
    } catch (err) {
        console.error('Error generating roster suggestions:', err)
        return errorResponse('Failed to generate roster suggestions', 'INTERNAL_ERROR', 500)
    }
}
