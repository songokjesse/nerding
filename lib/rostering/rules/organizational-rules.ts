import { RuleViolation, RuleCategory, ShiftData, WorkerData, ClientData } from '../rules-engine'
import prisma from '@/lib/prisma'

/**
 * Organizational Policy Rules
 * 
 * Validates:
 * - Worker availability
 * - Conflicts of interest
 * - Fair workload distribution
 * - Location proximity
 * - Preferred shift patterns
 */

// ============================================================================
// Constants
// ============================================================================

const MAX_SHIFTS_PER_WEEK = 20
const MAX_DISTANCE_KM = 50
const FAIR_DISTRIBUTION_THRESHOLD = 0.3 // 30% variance acceptable

// ============================================================================
// Validation Functions
// ============================================================================

export async function validateOrganizationalRules(
    shift: ShiftData,
    worker: WorkerData,
    client: ClientData
): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    // Check worker availability
    violations.push(...await checkWorkerAvailability(shift, worker))

    // Check workload distribution
    violations.push(...await checkWorkloadDistribution(shift, worker))

    // Check max hours rule
    violations.push(...await checkMaxHoursRule(shift, worker))

    // Check location proximity
    if (shift.location) {
        violations.push(...await checkLocationProximity(shift, worker))
    }

    return violations
}

/**
 * Check if worker has exceeded their maximum fortnightly hours
 */
async function checkMaxHoursRule(shift: ShiftData, worker: WorkerData): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    if (!worker.maxFortnightlyHours) {
        return violations
    }

    // Calculate fortnight range (standard 2-week cycle)
    // For simplicity, we'll assume fortnights start on a fixed anchor date or just check a rolling 14-day window
    // A rolling window is safer for compliance if pay cycles aren't strictly defined
    const shiftDate = new Date(shift.startTime)
    const fortnightStart = new Date(shiftDate)
    fortnightStart.setDate(shiftDate.getDate() - 13) // Look back 13 days + current day = 14 days

    // Fetch all shifts in this window
    const shiftsInWindow = await prisma.shift.findMany({
        where: {
            shiftWorkerLink: {
                some: { workerId: worker.id }
            },
            startTime: {
                gte: fortnightStart,
                lte: shiftDate
            },
            // Exclude the current shift if it's being updated (optional, but good for edits)
            // id: { not: shift.id } 
        },
        select: {
            startTime: true,
            endTime: true
        }
    })

    // Calculate total hours
    let totalHours = 0
    for (const s of shiftsInWindow) {
        const duration = (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60 * 60)
        totalHours += duration
    }

    // Add current shift duration
    const currentShiftDuration = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60)
    totalHours += currentShiftDuration

    if (totalHours > worker.maxFortnightlyHours) {
        violations.push({
            ruleId: 'ORG_004_MAX_HOURS',
            severity: 'SOFT', // Warning only - allow creation but flag for visual indication
            category: RuleCategory.ORGANIZATIONAL,
            message: `Worker exceeds maximum fortnightly hours (${worker.maxFortnightlyHours}h). Current total: ${totalHours.toFixed(1)}h`,
            affectedEntity: worker.id,
            suggestedResolution: 'Assign a different worker or reduce shift duration',
            details: {
                maxHours: worker.maxFortnightlyHours,
                currentTotal: totalHours,
                windowStart: fortnightStart.toISOString(),
                windowEnd: shiftDate.toISOString()
            }
        })
    }

    return violations
}

/**
 * Check if worker is available for this shift
 */
async function checkWorkerAvailability(shift: ShiftData, worker: WorkerData): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    // Check worker availability records
    const availability = await prisma.workerAvailability.findFirst({
        where: {
            workerId: worker.id,
            date: {
                gte: new Date(shift.startTime.toDateString()),
                lt: new Date(new Date(shift.startTime).setDate(shift.startTime.getDate() + 1))
            },
            isAvailable: false
        }
    })

    if (availability) {
        violations.push({
            ruleId: 'ORG_001_UNAVAILABLE',
            severity: 'SOFT',
            category: RuleCategory.ORGANIZATIONAL,
            message: `Worker marked as unavailable on ${shift.startTime.toDateString()}`,
            affectedEntity: worker.id,
            suggestedResolution: 'Assign different worker or confirm availability override',
            details: {
                date: shift.startTime.toDateString(),
                notes: availability.notes
            }
        })
    }

    return violations
}

/**
 * Check fair workload distribution
 */
async function checkWorkloadDistribution(shift: ShiftData, worker: WorkerData): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    // Get shift count for this worker in the current week
    const weekStart = new Date(shift.startTime)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const workerShiftCount = await prisma.shift.count({
        where: {
            shiftWorkerLink: {
                some: { workerId: worker.id }
            },
            startTime: {
                gte: weekStart,
                lt: weekEnd
            }
        }
    })

    if (workerShiftCount >= MAX_SHIFTS_PER_WEEK) {
        violations.push({
            ruleId: 'ORG_002_OVERLOADED',
            severity: 'SOFT',
            category: RuleCategory.ORGANIZATIONAL,
            message: `Worker already has ${workerShiftCount} shifts this week (max recommended: ${MAX_SHIFTS_PER_WEEK})`,
            affectedEntity: worker.id,
            suggestedResolution: 'Consider distributing shifts more evenly across workers',
            details: {
                currentShiftCount: workerShiftCount,
                maxRecommended: MAX_SHIFTS_PER_WEEK,
                weekStart: weekStart.toISOString()
            }
        })
    }

    return violations
}

/**
 * Check location proximity
 */
async function checkLocationProximity(shift: ShiftData, worker: WorkerData): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    // This would require worker home location or previous shift location
    // For now, we'll check if shift has excessive travel distance
    if (shift.travelDistance && shift.travelDistance > MAX_DISTANCE_KM) {
        violations.push({
            ruleId: 'ORG_003_DISTANCE',
            severity: 'SOFT',
            category: RuleCategory.ORGANIZATIONAL,
            message: `Shift location is ${shift.travelDistance.toFixed(1)}km away (max recommended: ${MAX_DISTANCE_KM}km)`,
            affectedEntity: worker.id,
            suggestedResolution: 'Consider assigning worker closer to shift location',
            details: {
                distance: shift.travelDistance,
                maxRecommended: MAX_DISTANCE_KM
            }
        })
    }

    return violations
}

/**
 * Check for conflicts of interest
 */
export async function checkConflictsOfInterest(
    worker: WorkerData,
    client: ClientData
): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    // This would require additional data about relationships
    // Placeholder for future implementation
    // Example: Check if worker is related to client
    // Example: Check if worker has financial interest

    return violations
}

/**
 * Check preferred shift patterns
 */
export async function checkShiftPatternPreferences(
    shift: ShiftData,
    worker: WorkerData
): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    // This would check worker preferences stored in JSON field
    // Placeholder for future implementation
    // Example: Worker prefers morning shifts
    // Example: Worker prefers weekdays only

    return violations
}

/**
 * Check for scheduling conflicts with other commitments
 */
export async function checkOtherCommitments(
    shift: ShiftData,
    worker: WorkerData
): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    // Check for overlapping appointments or other commitments
    // This would integrate with calendar/appointment system
    // Placeholder for future implementation

    return violations
}
