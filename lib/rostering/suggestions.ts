import {
    SuggestedShift,
    Conflict,
    RosterSuggestionRequestDto,
    ClientWithNeeds,
    WorkerWithAvailability
} from './types'
import { checkTimeOverlap } from './validation'

/**
 * Basic algorithmic roster suggestion engine
 * Future: Will be enhanced with Gemini AI integration
 */

// ============================================================================
// Matching Score Calculation
// ============================================================================

export function calculateWorkerClientMatch(
    worker: WorkerWithAvailability,
    client: ClientWithNeeds,
    shift: { startTime: Date; endTime: Date; serviceType?: string }
): { score: number; reasoning: string[] } {
    let score = 50 // Base score
    const reasoning: string[] = []

    // Check qualifications
    if (client.requiredQualifications && client.requiredQualifications.length > 0) {
        const workerQuals = worker.qualifications || []
        const matchedQuals = client.requiredQualifications.filter(req =>
            workerQuals.includes(req)
        )

        if (matchedQuals.length === client.requiredQualifications.length) {
            score += 20
            reasoning.push(`Has all required qualifications: ${matchedQuals.join(', ')}`)
        } else if (matchedQuals.length > 0) {
            score += 10
            reasoning.push(`Has some qualifications: ${matchedQuals.join(', ')}`)
        } else {
            score -= 30
            reasoning.push('Missing required qualifications')
        }
    }

    // Check preferred workers
    if (client.preferredWorkers && client.preferredWorkers.includes(worker.id)) {
        score += 15
        reasoning.push('Client prefers this worker')
    }

    // Check excluded workers
    if (client.excludedWorkers && client.excludedWorkers.includes(worker.id)) {
        score -= 50
        reasoning.push('Client has excluded this worker')
    }

    // Check availability
    const hasAvailability = worker.availability.some(avail => {
        if (!avail.isAvailable) return false
        const availStart = new Date(avail.startTime)
        const availEnd = new Date(avail.endTime)
        return checkTimeOverlap(shift.startTime, shift.endTime, availStart, availEnd)
    })

    if (hasAvailability) {
        score += 15
        reasoning.push('Worker is available during shift time')
    } else {
        score -= 40
        reasoning.push('Worker has no availability during shift time')
    }

    // Consider workload balance
    if (worker.assignedShiftsCount !== undefined) {
        if (worker.assignedShiftsCount < 5) {
            score += 5
            reasoning.push('Worker has light schedule')
        } else if (worker.assignedShiftsCount > 15) {
            score -= 5
            reasoning.push('Worker has heavy schedule')
        }
    }

    return { score: Math.max(0, Math.min(100, score)), reasoning }
}

// ============================================================================
// Suggestion Generation
// ============================================================================

export function generateShiftSuggestions(
    request: RosterSuggestionRequestDto,
    availableWorkers: WorkerWithAvailability[],
    clients: ClientWithNeeds[]
): SuggestedShift[] {
    const suggestions: SuggestedShift[] = []

    // For each client, suggest shifts
    const targetClients = request.clientIds
        ? clients.filter(c => request.clientIds!.includes(c.id))
        : clients

    targetClients.forEach(client => {
        // Determine shift needs (this is simplified - in real app would be more sophisticated)
        const shiftDuration = 8 * 60 * 60 * 1000 // 8 hours in milliseconds
        const startDate = new Date(request.startDate)
        const endDate = new Date(request.endDate)

        // Generate daily shifts for the period
        let currentDate = new Date(startDate)
        while (currentDate <= endDate) {
            // Morning shift (8am - 4pm)
            const morningStart = new Date(currentDate)
            morningStart.setHours(8, 0, 0, 0)
            const morningEnd = new Date(morningStart)
            morningEnd.setHours(16, 0, 0, 0)

            const suggestion = suggestWorkersForShift(
                morningStart,
                morningEnd,
                [client.id],
                availableWorkers,
                client,
                request.siteId
            )

            if (suggestion) {
                suggestions.push(suggestion)
            }

            currentDate.setDate(currentDate.getDate() + 1)
        }
    })

    // Sort by match score
    return suggestions.sort((a, b) => b.matchScore - a.matchScore)
}

function suggestWorkersForShift(
    startTime: Date,
    endTime: Date,
    clientIds: string[],
    availableWorkers: WorkerWithAvailability[],
    client: ClientWithNeeds,
    siteId?: string
): SuggestedShift | null {
    const workerScores: Array<{
        workerId: string
        score: number
        reasoning: string[]
    }> = []

    // Score each worker for this shift
    availableWorkers.forEach(worker => {
        const { score, reasoning } = calculateWorkerClientMatch(worker, client, {
            startTime,
            endTime,
            serviceType: 'Personal Care' // Default - would be dynamic in real app
        })

        workerScores.push({
            workerId: worker.id,
            score,
            reasoning
        })
    })

    // Sort by score and take top worker(s)
    workerScores.sort((a, b) => b.score - a.score)

    if (workerScores.length === 0 || workerScores[0].score < 30) {
        // No suitable workers found
        return null
    }

    const topWorker = workerScores[0]

    return {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        workerIds: [topWorker.workerId],
        clientIds,
        siteId,
        serviceType: 'Personal Care',
        matchScore: topWorker.score,
        reasoning: topWorker.reasoning.join('; ')
    }
}

// ============================================================================
// Conflict Detection for Suggestions
// ============================================================================

export function detectSuggestionConflicts(
    suggestions: SuggestedShift[],
    existingShifts: Array<{
        id: string
        startTime: string
        endTime: string
        workerIds: string[]
        clientIds: string[]
    }>
): Conflict[] {
    const conflicts: Conflict[] = []

    // Convert to common format for validation
    const allShifts = [
        ...suggestions.map(s => ({
            startTime: s.startTime,
            endTime: s.endTime,
            workerIds: s.workerIds,
            clientIds: s.clientIds
        })),
        ...existingShifts
    ]

    // Check for worker overlaps
    const workerShiftMap = new Map<string, Array<{ start: Date; end: Date; id?: string }>>()

    allShifts.forEach((shift, index) => {
        shift.workerIds.forEach(workerId => {
            if (!workerShiftMap.has(workerId)) {
                workerShiftMap.set(workerId, [])
            }
            workerShiftMap.get(workerId)!.push({
                start: new Date(shift.startTime),
                end: new Date(shift.endTime),
                id: index < suggestions.length ? undefined : existingShifts[index - suggestions.length].id
            })
        })
    })

    workerShiftMap.forEach((shifts, workerId) => {
        for (let i = 0; i < shifts.length; i++) {
            for (let j = i + 1; j < shifts.length; j++) {
                if (checkTimeOverlap(shifts[i].start, shifts[i].end, shifts[j].start, shifts[j].end)) {
                    conflicts.push({
                        type: 'overlap',
                        severity: 'high',
                        workerId,
                        message: `Worker has overlapping shifts on ${shifts[i].start.toLocaleDateString()}`,
                        suggestedResolution: 'Assign different worker or adjust timing'
                    })
                }
            }
        }
    })

    return conflicts
}

// ============================================================================
// Future: Gemini Integration Placeholder
// ============================================================================

/**
 * This function will be enhanced with Gemini AI in Phase 2
 * to provide:
 * - Natural language understanding of complex preferences
 * - Learning from historical roster patterns
 * - More sophisticated conflict resolution
 * - Explanation generation for suggestions
 */
export async function enhanceSuggestionsWithAI(
    suggestions: SuggestedShift[],
    context: {
        historicalData?: any
        organizationPreferences?: any
    }
): Promise<{
    enhancedSuggestions: SuggestedShift[]
    aiInsights: string
}> {
    // TODO: Implement Gemini integration
    // For now, return suggestions as-is
    return {
        enhancedSuggestions: suggestions,
        aiInsights: 'AI enhancement not yet implemented'
    }
}
