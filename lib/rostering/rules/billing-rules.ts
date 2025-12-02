import { ShiftData, CostBreakdown } from '../rules-engine'
import { ShiftType } from '@/generated/prisma/client/enums'

/**
 * Billing & Costing Rules
 * 
 * Calculates:
 * - Shift type classification
 * - Penalty rates (evening, weekend, public holiday)
 * - Overtime calculations
 * - Travel claims
 * - Activity-based costing
 */

// ============================================================================
// Constants - SCHADS Award Pay Rates (Example rates)
// ============================================================================

const BASE_HOURLY_RATE = 32.50 // Example base rate for Level 2 support worker

const PENALTY_RATES = {
    [ShiftType.STANDARD]: 1.0,
    [ShiftType.EVENING]: 1.15,      // 15% loading for evening (after 6pm)
    [ShiftType.SATURDAY]: 1.5,      // 50% loading for Saturday
    [ShiftType.SUNDAY]: 1.75,       // 75% loading for Sunday
    [ShiftType.PUBLIC_HOLIDAY]: 2.5, // 150% loading for public holidays
    [ShiftType.SLEEPOVER]: 0.3,     // Sleepover allowance (not hourly rate)
    [ShiftType.ACTIVE_OVERNIGHT]: 1.5 // 50% loading for active overnight
}

const OVERTIME_RATE = 1.5 // Time and a half for overtime
const DOUBLE_TIME_RATE = 2.0 // Double time for excessive overtime

const TRAVEL_RATE_PER_KM = 0.85 // Per km travel allowance
const MIN_TRAVEL_CLAIM_KM = 5 // Minimum distance to claim travel

// ============================================================================
// Cost Calculation Functions
// ============================================================================

/**
 * Calculate the total cost of a shift including all loadings
 */
export function calculateCost(shift: ShiftData): CostBreakdown {
    const durationHours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60)

    // Get penalty multiplier based on shift type
    const penaltyMultiplier = PENALTY_RATES[shift.shiftType] || 1.0

    // Calculate standard hours and overtime
    const { standardHours, overtimeHours } = calculateOvertimeBreakdown(durationHours, shift.shiftType)

    // Calculate costs
    const standardCost = standardHours * BASE_HOURLY_RATE * penaltyMultiplier
    const overtimeCost = overtimeHours * BASE_HOURLY_RATE * penaltyMultiplier * OVERTIME_RATE

    const totalCost = standardCost + overtimeCost

    return {
        baseRate: BASE_HOURLY_RATE,
        penaltyMultiplier,
        totalHours: durationHours,
        totalCost,
        shiftType: shift.shiftType,
        breakdown: {
            standardHours,
            overtimeHours,
            penaltyHours: durationHours // All hours get penalty if applicable
        }
    }
}

/**
 * Calculate overtime breakdown
 */
function calculateOvertimeBreakdown(
    totalHours: number,
    shiftType: ShiftType
): { standardHours: number; overtimeHours: number } {
    // Sleepover shifts don't have traditional overtime
    if (shiftType === ShiftType.SLEEPOVER) {
        return {
            standardHours: totalHours,
            overtimeHours: 0
        }
    }

    // Overtime kicks in after 10 hours in a single shift
    const MAX_ORDINARY_HOURS = 10

    if (totalHours <= MAX_ORDINARY_HOURS) {
        return {
            standardHours: totalHours,
            overtimeHours: 0
        }
    }

    return {
        standardHours: MAX_ORDINARY_HOURS,
        overtimeHours: totalHours - MAX_ORDINARY_HOURS
    }
}

/**
 * Calculate travel claim
 */
export function calculateTravelClaim(distance?: number): number {
    if (!distance || distance < MIN_TRAVEL_CLAIM_KM) {
        return 0
    }

    return distance * TRAVEL_RATE_PER_KM
}

/**
 * Classify shift type based on time
 */
export function classifyShiftType(startTime: Date, endTime: Date, isPublicHoliday = false): ShiftType {
    if (isPublicHoliday) {
        return ShiftType.PUBLIC_HOLIDAY
    }

    const dayOfWeek = startTime.getDay()
    const startHour = startTime.getHours()

    // Check if it's a sleepover (typically 10pm - 8am with sleep time)
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    if (startHour >= 22 && durationHours >= 8) {
        return ShiftType.SLEEPOVER
    }

    // Check if it's active overnight
    if (startHour >= 22 || startHour < 6) {
        return ShiftType.ACTIVE_OVERNIGHT
    }

    // Check day of week
    if (dayOfWeek === 0) { // Sunday
        return ShiftType.SUNDAY
    }

    if (dayOfWeek === 6) { // Saturday
        return ShiftType.SATURDAY
    }

    // Check if evening (after 6pm on weekday)
    if (startHour >= 18) {
        return ShiftType.EVENING
    }

    return ShiftType.STANDARD
}

/**
 * Calculate weekly cost for a worker
 */
export function calculateWeeklyCost(shifts: ShiftData[]): {
    totalCost: number
    standardCost: number
    overtimeCost: number
    penaltyCost: number
    travelCost: number
} {
    let totalCost = 0
    let standardCost = 0
    let overtimeCost = 0
    let penaltyCost = 0
    let travelCost = 0

    shifts.forEach(shift => {
        const cost = calculateCost(shift)
        totalCost += cost.totalCost

        // Break down costs
        const baseStandardCost = cost.breakdown.standardHours * BASE_HOURLY_RATE
        const baseOvertimeCost = cost.breakdown.overtimeHours * BASE_HOURLY_RATE * OVERTIME_RATE
        const penaltyAmount = (cost.totalCost - baseStandardCost - baseOvertimeCost)

        standardCost += baseStandardCost
        overtimeCost += baseOvertimeCost
        penaltyCost += penaltyAmount

        // Add travel if applicable
        if (shift.travelDistance) {
            travelCost += calculateTravelClaim(shift.travelDistance)
        }
    })

    return {
        totalCost,
        standardCost,
        overtimeCost,
        penaltyCost,
        travelCost
    }
}

/**
 * Estimate monthly cost for a client
 */
export function estimateMonthlyClientCost(
    shiftsPerWeek: number,
    averageShiftHours: number,
    shiftType: ShiftType = ShiftType.STANDARD
): number {
    const weeksPerMonth = 4.33 // Average weeks per month
    const totalShifts = shiftsPerWeek * weeksPerMonth
    const totalHours = totalShifts * averageShiftHours

    const penaltyMultiplier = PENALTY_RATES[shiftType] || 1.0
    const costPerHour = BASE_HOURLY_RATE * penaltyMultiplier

    return totalHours * costPerHour
}

/**
 * Get cost summary for reporting
 */
export function getCostSummary(shift: ShiftData): {
    description: string
    baseRate: number
    penalty: string
    totalRate: number
    hours: number
    totalCost: number
} {
    const cost = calculateCost(shift)
    const penaltyPercentage = ((cost.penaltyMultiplier - 1) * 100).toFixed(0)
    const penaltyDescription = cost.penaltyMultiplier > 1
        ? `+${penaltyPercentage}% ${shift.shiftType.toLowerCase()}`
        : 'Standard'

    return {
        description: `${shift.shiftType} shift`,
        baseRate: cost.baseRate,
        penalty: penaltyDescription,
        totalRate: cost.baseRate * cost.penaltyMultiplier,
        hours: cost.totalHours,
        totalCost: cost.totalCost
    }
}
