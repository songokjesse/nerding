import { RuleViolation, RuleCategory, ShiftData, WorkerData } from '../rules-engine'
import { ShiftType, ShiftCategory } from '@/generated/prisma/client/enums'
import prisma from '@/lib/prisma'

/**
 * SCHADS Award Compliance Rules
 * 
 * Validates:
 * - Minimum shift length (2-3 hours)
 * - Maximum hours per day (10 hours ordinary time)
 * - Maximum hours per week (38 hours full-time, 76 per fortnight)
 * - Minimum break between shifts (10 hours)
 * - Sleepover and active overnight conditions
 * - Penalty rate triggers
 */

// ============================================================================
// Constants - SCHADS Award 2010
// ============================================================================

const MIN_SHIFT_LENGTH_HOURS = 2
const MIN_SHIFT_LENGTH_HOURS_REGULAR = 3 // For regular employees
const MAX_ORDINARY_HOURS_PER_DAY = 10
const MAX_ORDINARY_HOURS_PER_WEEK = 38
const MAX_ORDINARY_HOURS_PER_FORTNIGHT = 76
const MIN_BREAK_BETWEEN_SHIFTS_HOURS = 10
const MIN_SLEEPOVER_HOURS = 5
const MAX_CONSECUTIVE_DAYS = 7

// ============================================================================
// Validation Functions
// ============================================================================

export async function validateSCHADSCompliance(
    shift: ShiftData,
    worker: WorkerData
): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    // Check minimum shift length
    violations.push(...checkMinimumShiftLength(shift))

    // Check maximum daily hours
    violations.push(...await checkMaximumDailyHours(shift, worker))

    // Check sleepover conditions (based on shift category, not shift type)
    // Note: shift.shiftCategory would need to be added to ShiftData interface
    // For now, we'll check if it's an overnight shift type
    if (shift.shiftType === ShiftType.OVERNIGHT) {
        violations.push(...checkSleepoverConditions(shift))
    }

    return violations
}

/**
 * Validate worker's entire schedule for SCHADS compliance
 */
export async function validateScheduleRules(
    shifts: any[],
    worker: WorkerData
): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    if (shifts.length === 0) return violations

    // Sort shifts by start time
    const sortedShifts = [...shifts].sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )

    // Check breaks between consecutive shifts
    violations.push(...checkBreaksBetweenShifts(sortedShifts, worker))

    // Check weekly hours
    violations.push(...checkWeeklyHours(sortedShifts, worker))

    // Check consecutive days
    violations.push(...checkConsecutiveDays(sortedShifts, worker))

    return violations
}

/**
 * Check minimum shift length
 */
function checkMinimumShiftLength(shift: ShiftData): RuleViolation[] {
    const violations: RuleViolation[] = []

    const durationHours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60)

    // Overnight shifts have different minimum (sleepover would be checked via shiftCategory)
    if (shift.shiftType === ShiftType.OVERNIGHT) {
        if (durationHours < MIN_SLEEPOVER_HOURS) {
            violations.push({
                ruleId: 'SCHADS_001_MIN_OVERNIGHT',
                severity: 'HARD',
                category: RuleCategory.SCHADS_AWARD,
                message: `Overnight shift must be at least ${MIN_SLEEPOVER_HOURS} hours (currently ${durationHours.toFixed(1)}h)`,
                suggestedResolution: `Extend shift to ${MIN_SLEEPOVER_HOURS} hours minimum`,
                details: { currentDuration: durationHours, minimumRequired: MIN_SLEEPOVER_HOURS }
            })
        }
        return violations
    }

    // Regular shifts
    if (durationHours < MIN_SHIFT_LENGTH_HOURS) {
        violations.push({
            ruleId: 'SCHADS_002_MIN_SHIFT',
            severity: 'HARD',
            category: RuleCategory.SCHADS_AWARD,
            message: `Shift must be at least ${MIN_SHIFT_LENGTH_HOURS} hours (currently ${durationHours.toFixed(1)}h)`,
            suggestedResolution: `Extend shift to ${MIN_SHIFT_LENGTH_HOURS} hours minimum or combine with another shift`,
            details: { currentDuration: durationHours, minimumRequired: MIN_SHIFT_LENGTH_HOURS }
        })
    } else if (durationHours < MIN_SHIFT_LENGTH_HOURS_REGULAR) {
        // Warning for shifts under 3 hours (less economical)
        violations.push({
            ruleId: 'SCHADS_003_SHORT_SHIFT',
            severity: 'SOFT',
            category: RuleCategory.SCHADS_AWARD,
            message: `Shift is ${durationHours.toFixed(1)} hours - consider extending to ${MIN_SHIFT_LENGTH_HOURS_REGULAR}h for better efficiency`,
            suggestedResolution: 'Extend shift or combine with adjacent shifts',
            details: { currentDuration: durationHours, recommended: MIN_SHIFT_LENGTH_HOURS_REGULAR }
        })
    }

    return violations
}

/**
 * Check maximum hours in a single day
 */
async function checkMaximumDailyHours(
    shift: ShiftData,
    worker: WorkerData
): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    const shiftDate = new Date(shift.startTime)
    shiftDate.setHours(0, 0, 0, 0)

    const nextDay = new Date(shiftDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // Get all shifts for this worker on this day
    const dayShifts = await prisma.shift.findMany({
        where: {
            shiftWorkerLink: {
                some: { workerId: worker.id }
            },
            startTime: {
                gte: shiftDate,
                lt: nextDay
            },
            ...(shift.id ? { id: { not: shift.id } } : {})
        }
    })

    // Calculate total hours including this shift
    let totalHours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60)

    dayShifts.forEach(existingShift => {
        const hours = (existingShift.endTime.getTime() - existingShift.startTime.getTime()) / (1000 * 60 * 60)
        totalHours += hours
    })

    if (totalHours > MAX_ORDINARY_HOURS_PER_DAY) {
        const overtimeHours = totalHours - MAX_ORDINARY_HOURS_PER_DAY
        violations.push({
            ruleId: 'SCHADS_004_MAX_DAILY',
            severity: 'SOFT',
            category: RuleCategory.SCHADS_AWARD,
            message: `Worker exceeds ${MAX_ORDINARY_HOURS_PER_DAY} hours in a day (${totalHours.toFixed(1)}h total, ${overtimeHours.toFixed(1)}h overtime)`,
            affectedEntity: worker.id,
            suggestedResolution: 'Overtime rates apply. Consider spreading shifts across multiple days.',
            details: {
                totalHours,
                ordinaryHours: MAX_ORDINARY_HOURS_PER_DAY,
                overtimeHours,
                date: shiftDate.toISOString().split('T')[0]
            }
        })
    }

    return violations
}

/**
 * Check breaks between consecutive shifts
 */
function checkBreaksBetweenShifts(shifts: any[], worker: WorkerData): RuleViolation[] {
    const violations: RuleViolation[] = []

    for (let i = 0; i < shifts.length - 1; i++) {
        const currentShift = shifts[i]
        const nextShift = shifts[i + 1]

        const breakHours = (new Date(nextShift.startTime).getTime() - new Date(currentShift.endTime).getTime()) / (1000 * 60 * 60)

        if (breakHours < MIN_BREAK_BETWEEN_SHIFTS_HOURS) {
            violations.push({
                ruleId: 'SCHADS_005_MIN_BREAK',
                severity: 'HARD',
                category: RuleCategory.SCHADS_AWARD,
                message: `Insufficient break between shifts (${breakHours.toFixed(1)}h, minimum ${MIN_BREAK_BETWEEN_SHIFTS_HOURS}h required)`,
                affectedEntity: worker.id,
                suggestedResolution: `Increase gap between shifts to at least ${MIN_BREAK_BETWEEN_SHIFTS_HOURS} hours`,
                details: {
                    breakHours,
                    minimumRequired: MIN_BREAK_BETWEEN_SHIFTS_HOURS,
                    shift1End: currentShift.endTime,
                    shift2Start: nextShift.startTime
                }
            })
        }
    }

    return violations
}

/**
 * Check weekly hours
 */
function checkWeeklyHours(shifts: any[], worker: WorkerData): RuleViolation[] {
    const violations: RuleViolation[] = []

    // Group shifts by week
    const weekMap = new Map<string, any[]>()

    shifts.forEach(shift => {
        const startDate = new Date(shift.startTime)
        const weekStart = new Date(startDate)
        weekStart.setDate(startDate.getDate() - startDate.getDay()) // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0)

        const weekKey = weekStart.toISOString().split('T')[0]

        if (!weekMap.has(weekKey)) {
            weekMap.set(weekKey, [])
        }
        weekMap.get(weekKey)!.push(shift)
    })

    // Check each week
    weekMap.forEach((weekShifts, weekStart) => {
        let totalHours = 0

        weekShifts.forEach(shift => {
            const hours = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60)
            totalHours += hours
        })

        if (totalHours > MAX_ORDINARY_HOURS_PER_WEEK) {
            const overtimeHours = totalHours - MAX_ORDINARY_HOURS_PER_WEEK
            violations.push({
                ruleId: 'SCHADS_006_MAX_WEEKLY',
                severity: 'SOFT',
                category: RuleCategory.SCHADS_AWARD,
                message: `Worker exceeds ${MAX_ORDINARY_HOURS_PER_WEEK} hours per week (${totalHours.toFixed(1)}h total, ${overtimeHours.toFixed(1)}h overtime)`,
                affectedEntity: worker.id,
                suggestedResolution: 'Overtime rates apply. Consider redistributing shifts.',
                details: {
                    totalHours,
                    ordinaryHours: MAX_ORDINARY_HOURS_PER_WEEK,
                    overtimeHours,
                    weekStart
                }
            })
        }
    })

    return violations
}

/**
 * Check consecutive working days
 */
function checkConsecutiveDays(shifts: any[], worker: WorkerData): RuleViolation[] {
    const violations: RuleViolation[] = []

    // Get unique working days
    const workingDays = new Set<string>()
    shifts.forEach(shift => {
        const date = new Date(shift.startTime)
        date.setHours(0, 0, 0, 0)
        workingDays.add(date.toISOString().split('T')[0])
    })

    const sortedDays = Array.from(workingDays).sort()

    let consecutiveCount = 1
    let consecutiveStart = sortedDays[0]

    for (let i = 1; i < sortedDays.length; i++) {
        const prevDate = new Date(sortedDays[i - 1])
        const currDate = new Date(sortedDays[i])

        const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)

        if (dayDiff === 1) {
            consecutiveCount++

            if (consecutiveCount > MAX_CONSECUTIVE_DAYS) {
                violations.push({
                    ruleId: 'SCHADS_007_CONSECUTIVE_DAYS',
                    severity: 'SOFT',
                    category: RuleCategory.SCHADS_AWARD,
                    message: `Worker scheduled for ${consecutiveCount} consecutive days (recommended max: ${MAX_CONSECUTIVE_DAYS})`,
                    affectedEntity: worker.id,
                    suggestedResolution: 'Schedule rest days to prevent fatigue',
                    details: {
                        consecutiveDays: consecutiveCount,
                        startDate: consecutiveStart,
                        endDate: sortedDays[i]
                    }
                })
            }
        } else {
            consecutiveCount = 1
            consecutiveStart = sortedDays[i]
        }
    }

    return violations
}

/**
 * Check sleepover shift conditions
 */
function checkSleepoverConditions(shift: ShiftData): RuleViolation[] {
    const violations: RuleViolation[] = []

    const durationHours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60)
    const startHour = shift.startTime.getHours()
    const endHour = shift.endTime.getHours()

    // Overnight shifts should typically be overnight hours (e.g., 10pm - 8am)
    if (shift.shiftType === ShiftType.OVERNIGHT) {
        if (startHour < 20 || endHour > 10) {
            violations.push({
                ruleId: 'SCHADS_008_OVERNIGHT_TIMING',
                severity: 'SOFT',
                category: RuleCategory.SCHADS_AWARD,
                message: 'Overnight shift timing unusual (typically 8pm-8am)',
                suggestedResolution: 'Verify shift type is correct',
                details: {
                    startHour,
                    endHour,
                    duration: durationHours
                }
            })
        }
    }

    return violations
}
