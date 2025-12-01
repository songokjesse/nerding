import { Conflict, ValidateShiftDto, RosteringRuleResponseDto } from './types'
import { RosteringRuleType } from '@/generated/prisma/client/enums'

/**
 * Core validation utilities for rostering
 */

// ============================================================================
// Time Overlap Detection
// ============================================================================

export function checkTimeOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
): boolean {
    return start1 < end2 && start2 < end1
}

export function findShiftOverlaps(
    shifts: ValidateShiftDto[],
    groupBy: 'worker' | 'client' = 'worker'
): Conflict[] {
    const conflicts: Conflict[] = []
    const grouped = new Map<string, ValidateShiftDto[]>()

    // Group shifts by worker or client
    shifts.forEach(shift => {
        const ids = groupBy === 'worker' ? shift.workerIds : shift.clientIds
        ids.forEach(id => {
            if (!grouped.has(id)) {
                grouped.set(id, [])
            }
            grouped.get(id)!.push(shift)
        })
    })

    // Check for overlaps within each group
    grouped.forEach((shiftsForEntity, entityId) => {
        for (let i = 0; i < shiftsForEntity.length; i++) {
            for (let j = i + 1; j < shiftsForEntity.length; j++) {
                const shift1 = shiftsForEntity[i]
                const shift2 = shiftsForEntity[j]

                const start1 = new Date(shift1.startTime)
                const end1 = new Date(shift1.endTime)
                const start2 = new Date(shift2.startTime)
                const end2 = new Date(shift2.endTime)

                if (checkTimeOverlap(start1, end1, start2, end2)) {
                    conflicts.push({
                        type: 'overlap',
                        severity: 'high',
                        shiftId: shift1.id,
                        workerId: groupBy === 'worker' ? entityId : undefined,
                        clientId: groupBy === 'client' ? entityId : undefined,
                        message: `${groupBy === 'worker' ? 'Worker' : 'Client'} has overlapping shifts: ${shift1.startTime} - ${shift1.endTime} and ${shift2.startTime} - ${shift2.endTime}`,
                        suggestedResolution: 'Adjust shift times or assign a different worker/client'
                    })
                }
            }
        }
    })

    return conflicts
}

// ============================================================================
// Worker Hours Calculation
// ============================================================================

export function calculateWorkerHours(
    shifts: ValidateShiftDto[],
    workerId: string,
    periodStart?: Date,
    periodEnd?: Date
): number {
    let totalHours = 0

    shifts.forEach(shift => {
        if (!shift.workerIds.includes(workerId)) return

        const shiftStart = new Date(shift.startTime)
        const shiftEnd = new Date(shift.endTime)

        // Filter by period if provided
        if (periodStart && shiftEnd < periodStart) return
        if (periodEnd && shiftStart > periodEnd) return

        const hours = (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60)
        totalHours += hours
    })

    return totalHours
}

export function getWeekBoundaries(date: Date): { start: Date; end: Date } {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - start.getDay()) // Start of week (Sunday)

    const end = new Date(start)
    end.setDate(end.getDate() + 7) // End of week

    return { start, end }
}

// ============================================================================
// Rule Validation
// ============================================================================

export function validateMaxHoursRule(
    rule: RosteringRuleResponseDto,
    shifts: ValidateShiftDto[]
): Conflict[] {
    const conflicts: Conflict[] = []
    const ruleData = rule.ruleJson as any

    if (!ruleData || ruleData.type !== 'max_hours') return conflicts

    // Get applicable workers
    const workerIds = ruleData.applyToAllWorkers
        ? [...new Set(shifts.flatMap(s => s.workerIds))]
        : (ruleData.workerIds || [])

    workerIds.forEach((workerId: string) => {
        // Check daily max hours
        if (ruleData.maxHoursPerDay) {
            const shiftsByDay = new Map<string, ValidateShiftDto[]>()
            shifts.forEach(shift => {
                if (!shift.workerIds.includes(workerId)) return
                const day = new Date(shift.startTime).toISOString().split('T')[0]
                if (!shiftsByDay.has(day)) {
                    shiftsByDay.set(day, [])
                }
                shiftsByDay.get(day)!.push(shift)
            })

            shiftsByDay.forEach((dayShifts, day) => {
                const totalHours = calculateWorkerHours(dayShifts, workerId)
                if (totalHours > ruleData.maxHoursPerDay) {
                    conflicts.push({
                        type: 'rule_violation',
                        severity: 'high',
                        workerId,
                        ruleId: rule.id,
                        message: `Worker exceeds max daily hours (${totalHours.toFixed(1)}h > ${ruleData.maxHoursPerDay}h) on ${day}`,
                        suggestedResolution: 'Reduce shift duration or reassign some shifts'
                    })
                }
            })
        }

        // Check weekly max hours
        if (ruleData.maxHoursPerWeek) {
            const shiftsByWeek = new Map<string, ValidateShiftDto[]>()
            shifts.forEach(shift => {
                if (!shift.workerIds.includes(workerId)) return
                const shiftDate = new Date(shift.startTime)
                const { start: weekStart } = getWeekBoundaries(shiftDate)
                const weekKey = weekStart.toISOString().split('T')[0]
                if (!shiftsByWeek.has(weekKey)) {
                    shiftsByWeek.set(weekKey, [])
                }
                shiftsByWeek.get(weekKey)!.push(shift)
            })

            shiftsByWeek.forEach((weekShifts, weekStart) => {
                const totalHours = calculateWorkerHours(weekShifts, workerId)
                if (totalHours > ruleData.maxHoursPerWeek) {
                    conflicts.push({
                        type: 'rule_violation',
                        severity: 'high',
                        workerId,
                        ruleId: rule.id,
                        message: `Worker exceeds max weekly hours (${totalHours.toFixed(1)}h > ${ruleData.maxHoursPerWeek}h) for week of ${weekStart}`,
                        suggestedResolution: 'Spread shifts across multiple weeks or workers'
                    })
                }
            })
        }
    })

    return conflicts
}

export function validateMinBreakRule(
    rule: RosteringRuleResponseDto,
    shifts: ValidateShiftDto[]
): Conflict[] {
    const conflicts: Conflict[] = []
    const ruleData = rule.ruleJson as any

    if (!ruleData || ruleData.type !== 'min_break') return conflicts

    const workerIds = ruleData.applyToAllWorkers
        ? [...new Set(shifts.flatMap(s => s.workerIds))]
        : (ruleData.workerIds || [])

    workerIds.forEach((workerId: string) => {
        const workerShifts = shifts
            .filter(s => s.workerIds.includes(workerId))
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

        for (let i = 0; i < workerShifts.length - 1; i++) {
            const currentShift = workerShifts[i]
            const nextShift = workerShifts[i + 1]

            const currentEnd = new Date(currentShift.endTime)
            const nextStart = new Date(nextShift.startTime)

            const breakMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60)

            if (breakMinutes < ruleData.minBreakMinutes) {
                conflicts.push({
                    type: 'rule_violation',
                    severity: 'medium',
                    workerId,
                    ruleId: rule.id,
                    message: `Insufficient break between shifts (${breakMinutes.toFixed(0)}min < ${ruleData.minBreakMinutes}min)`,
                    suggestedResolution: `Increase gap between shifts to at least ${ruleData.minBreakMinutes} minutes`
                })
            }
        }
    })

    return conflicts
}

export function validateQualificationRule(
    rule: RosteringRuleResponseDto,
    shifts: ValidateShiftDto[],
    workerQualifications: Map<string, string[]>
): Conflict[] {
    const conflicts: Conflict[] = []
    const ruleData = rule.ruleJson as any

    if (!ruleData || ruleData.type !== 'qualification_required') return conflicts

    const requiredQuals = ruleData.requiredQualifications || []

    shifts.forEach(shift => {
        // Check if rule applies to this shift
        const ruleApplies =
            (!ruleData.clientIds || shift.clientIds.some(id => ruleData.clientIds.includes(id))) &&
            (!ruleData.serviceTypes || ruleData.serviceTypes.includes(shift.serviceType))

        if (!ruleApplies) return

        shift.workerIds.forEach(workerId => {
            const workerQuals = workerQualifications.get(workerId) || []
            const missingQuals = requiredQuals.filter((req: string) => !workerQuals.includes(req))

            if (missingQuals.length > 0) {
                conflicts.push({
                    type: 'qualification',
                    severity: 'high',
                    shiftId: shift.id,
                    workerId,
                    ruleId: rule.id,
                    message: `Worker missing required qualifications: ${missingQuals.join(', ')}`,
                    suggestedResolution: 'Assign a qualified worker or update worker qualifications'
                })
            }
        })
    })

    return conflicts
}

// ============================================================================
// Main Validation Function
// ============================================================================

export function validateShifts(
    shifts: ValidateShiftDto[],
    rules: RosteringRuleResponseDto[],
    workerQualifications: Map<string, string[]>,
    includeWarnings = true
): Conflict[] {
    const conflicts: Conflict[] = []

    // Check for overlaps
    conflicts.push(...findShiftOverlaps(shifts, 'worker'))
    conflicts.push(...findShiftOverlaps(shifts, 'client'))

    // Validate against rules
    rules.forEach(rule => {
        if (!rule.isActive) return

        switch (rule.type) {
            case RosteringRuleType.HARD_CONSTRAINT:
                const ruleData = rule.ruleJson as any
                if (ruleData.type === 'max_hours') {
                    conflicts.push(...validateMaxHoursRule(rule, shifts))
                } else if (ruleData.type === 'min_break') {
                    conflicts.push(...validateMinBreakRule(rule, shifts))
                } else if (ruleData.type === 'qualification_required') {
                    conflicts.push(...validateQualificationRule(rule, shifts, workerQualifications))
                }
                break

            case RosteringRuleType.COMPLIANCE:
                // Validate compliance rules (similar to hard constraints)
                if (ruleData && ruleData.type === 'qualification_required') {
                    conflicts.push(...validateQualificationRule(rule, shifts, workerQualifications))
                }
                break

            case RosteringRuleType.SOFT_PREFERENCE:
                // Only include soft preferences if warnings are requested
                if (includeWarnings) {
                    // Could add preference validation here
                }
                break
        }
    })

    return conflicts
}
