import { RuleViolation, RuleCategory, ShiftData, WorkerData } from '../rules-engine'
import { RiskLevel } from '@/generated/prisma/client/enums'
import prisma from '@/lib/prisma'

/**
 * WHS (Work Health & Safety) Rules
 * 
 * Validates:
 * - Fatigue management (max 14 hours in 24-hour period)
 * - Manual handling safety
 * - Lone worker restrictions
 * - Travel time between shifts
 * - Maximum consecutive days
 */

// ============================================================================
// Constants - WHS Regulations
// ============================================================================

const MAX_HOURS_IN_24_PERIOD = 14
const MAX_TRAVEL_TIME_MINUTES = 90
const MIN_TRAVEL_BREAK_MINUTES = 30
const LONE_WORKER_MAX_RISK = RiskLevel.MEDIUM

// ============================================================================
// Validation Functions
// ============================================================================

export async function validateWHSSafety(
    shift: ShiftData,
    worker: WorkerData
): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    // Check fatigue (will be checked in schedule validation)
    // Individual shift checks here

    return violations
}

/**
 * Validate fatigue management across worker's schedule
 */
export async function validateFatigueManagement(
    shifts: any[],
    worker: WorkerData
): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    if (shifts.length === 0) return violations

    // Check for excessive hours in any 24-hour period
    shifts.forEach((shift, index) => {
        const shiftStart = new Date(shift.startTime)
        const shiftEnd = new Date(shift.endTime)
        const period24HoursLater = new Date(shiftStart)
        period24HoursLater.setHours(period24HoursLater.getHours() + 24)

        // Find all shifts that overlap with this 24-hour period
        let totalHours = 0

        shifts.forEach(otherShift => {
            const otherStart = new Date(otherShift.startTime)
            const otherEnd = new Date(otherShift.endTime)

            // Check if this shift overlaps with the 24-hour period
            if (otherStart < period24HoursLater && otherEnd > shiftStart) {
                const overlapStart = otherStart > shiftStart ? otherStart : shiftStart
                const overlapEnd = otherEnd < period24HoursLater ? otherEnd : period24HoursLater

                const hours = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60)
                totalHours += hours
            }
        })

        if (totalHours > MAX_HOURS_IN_24_PERIOD) {
            violations.push({
                ruleId: 'WHS_001_FATIGUE',
                severity: 'HARD',
                category: RuleCategory.WHS_SAFETY,
                message: `Worker exceeds ${MAX_HOURS_IN_24_PERIOD} hours in 24-hour period (${totalHours.toFixed(1)}h total) - fatigue risk`,
                affectedEntity: worker.id,
                suggestedResolution: 'Reduce shift hours or provide adequate rest breaks',
                details: {
                    totalHours,
                    maximumAllowed: MAX_HOURS_IN_24_PERIOD,
                    periodStart: shiftStart,
                    periodEnd: period24HoursLater
                }
            })
        }
    })

    return violations
}

/**
 * Check manual handling requirements
 */
export async function checkManualHandlingSafety(
    shift: ShiftData,
    worker: WorkerData,
    clientRequiresTransfers: boolean,
    clientRiskLevel: RiskLevel
): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    if (!clientRequiresTransfers) return violations

    // High-risk clients should have 2 workers for manual handling
    if (clientRiskLevel === RiskLevel.HIGH) {
        // This would need to check if there are multiple workers on the shift
        // For now, we'll add a warning
        violations.push({
            ruleId: 'WHS_002_MANUAL_HANDLING',
            severity: 'SOFT',
            category: RuleCategory.WHS_SAFETY,
            message: 'High-risk client requiring transfers - verify 2-person lift available',
            suggestedResolution: 'Assign second worker or verify client can be safely transferred by one person',
            details: {
                riskLevel: clientRiskLevel,
                requiresTransfers: true
            }
        })
    }

    return violations
}

/**
 * Check lone worker restrictions
 */
export async function checkLoneWorkerSafety(
    shift: ShiftData,
    clientRiskLevel: RiskLevel,
    workerCount: number
): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    // High-risk clients should not have lone workers
    if (clientRiskLevel === RiskLevel.HIGH && workerCount === 1) {
        violations.push({
            ruleId: 'WHS_003_LONE_WORKER',
            severity: 'HARD',
            category: RuleCategory.WHS_SAFETY,
            message: 'High-risk client requires multiple workers - lone worker not permitted',
            suggestedResolution: 'Assign additional worker for safety',
            details: {
                riskLevel: clientRiskLevel,
                currentWorkerCount: workerCount,
                minimumRequired: 2
            }
        })
    }

    // Overnight shifts with medium-risk clients should have backup
    const isOvernight = shift.startTime.getHours() >= 22 || shift.endTime.getHours() <= 6

    if (isOvernight && clientRiskLevel === RiskLevel.MEDIUM && workerCount === 1) {
        violations.push({
            ruleId: 'WHS_004_OVERNIGHT_LONE',
            severity: 'SOFT',
            category: RuleCategory.WHS_SAFETY,
            message: 'Overnight shift with medium-risk client - consider backup worker or on-call support',
            suggestedResolution: 'Assign second worker or ensure on-call support available',
            details: {
                riskLevel: clientRiskLevel,
                isOvernight: true
            }
        })
    }

    return violations
}

/**
 * Check travel time between shifts
 */
export async function checkTravelTime(
    currentShift: ShiftData,
    nextShift: ShiftData,
    worker: WorkerData
): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    // If both shifts have locations, check travel time
    if (!currentShift.location || !nextShift.location) {
        return violations
    }

    // If locations are different, check travel time
    if (currentShift.location !== nextShift.location) {
        const breakMinutes = (new Date(nextShift.startTime).getTime() - new Date(currentShift.endTime).getTime()) / (1000 * 60)

        // Estimate travel time based on distance (if available)
        let estimatedTravelMinutes = 30 // Default estimate

        if (currentShift.travelDistance && nextShift.travelDistance) {
            // Rough estimate: 40 km/h average speed in urban areas
            estimatedTravelMinutes = (Math.abs(currentShift.travelDistance - nextShift.travelDistance) / 40) * 60
        }

        const availableTime = breakMinutes - MIN_TRAVEL_BREAK_MINUTES // Account for minimum break

        if (availableTime < estimatedTravelMinutes) {
            violations.push({
                ruleId: 'WHS_005_TRAVEL_TIME',
                severity: 'SOFT',
                category: RuleCategory.WHS_SAFETY,
                message: `Insufficient time for travel between shifts (${breakMinutes.toFixed(0)}min break, ~${estimatedTravelMinutes.toFixed(0)}min travel estimated)`,
                affectedEntity: worker.id,
                suggestedResolution: 'Increase gap between shifts or assign shifts in same location',
                details: {
                    breakMinutes,
                    estimatedTravelMinutes,
                    location1: currentShift.location,
                    location2: nextShift.location
                }
            })
        }

        if (estimatedTravelMinutes > MAX_TRAVEL_TIME_MINUTES) {
            violations.push({
                ruleId: 'WHS_006_EXCESSIVE_TRAVEL',
                severity: 'SOFT',
                category: RuleCategory.WHS_SAFETY,
                message: `Excessive travel time between shifts (~${estimatedTravelMinutes.toFixed(0)}min)`,
                affectedEntity: worker.id,
                suggestedResolution: 'Consider assigning worker to shifts in closer proximity',
                details: {
                    estimatedTravelMinutes,
                    maximumRecommended: MAX_TRAVEL_TIME_MINUTES
                }
            })
        }
    }

    return violations
}

/**
 * Check for adequate rest periods
 */
export async function checkRestPeriods(
    shifts: any[],
    worker: WorkerData
): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    // Check for at least one full day off per week
    const workingDays = new Set<string>()

    shifts.forEach(shift => {
        const date = new Date(shift.startTime)
        date.setHours(0, 0, 0, 0)
        workingDays.add(date.toISOString().split('T')[0])
    })

    // Group by week
    const weekMap = new Map<string, Set<string>>()

    workingDays.forEach(day => {
        const date = new Date(day)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekKey = weekStart.toISOString().split('T')[0]

        if (!weekMap.has(weekKey)) {
            weekMap.set(weekKey, new Set())
        }
        weekMap.get(weekKey)!.add(day)
    })

    // Check each week
    weekMap.forEach((days, weekStart) => {
        if (days.size === 7) {
            violations.push({
                ruleId: 'WHS_007_NO_REST_DAY',
                severity: 'SOFT',
                category: RuleCategory.WHS_SAFETY,
                message: `Worker scheduled for all 7 days in week of ${weekStart} - no rest day`,
                affectedEntity: worker.id,
                suggestedResolution: 'Schedule at least one rest day per week',
                details: {
                    weekStart,
                    daysWorked: days.size
                }
            })
        }
    })

    return violations
}
