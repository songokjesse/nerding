/**
 * NDIS Hour Tracking Utilities
 * 
 * Functions for calculating and managing NDIS hour utilization
 */

import prisma from '@/lib/prisma'

export interface NDISHoursSummary {
    clientId: string
    allocatedHours: number | null
    usedHours: number
    remainingHours: number | null
    percentageUsed: number | null
    planStartDate: Date | null
    planEndDate: Date | null
    isApproachingLimit: boolean // > 80%
    isExceeded: boolean // > 100%
}

/**
 * Calculate total hours used by a client within their NDIS plan period
 */
export async function calculateClientHoursUsed(
    clientId: string,
    startDate?: Date,
    endDate?: Date
): Promise<number> {
    // Get client requirements to determine plan period
    const requirements = await prisma.clientRequirement.findUnique({
        where: { clientId }
    })

    const periodStart = startDate || requirements?.ndisPlanStartDate || new Date(new Date().getFullYear(), 0, 1)
    const periodEnd = endDate || requirements?.ndisPlanEndDate || new Date(new Date().getFullYear(), 11, 31)

    // Get all shifts for this client in the period
    const shifts = await prisma.shift.findMany({
        where: {
            shiftClientLink: {
                some: { clientId }
            },
            startTime: {
                gte: periodStart,
                lte: periodEnd
            },
            status: {
                in: ['COMPLETED', 'IN_PROGRESS', 'PLANNED']
            }
        }
    })

    // Calculate total hours
    const totalHours = shifts.reduce((sum, shift) => {
        const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60)
        return sum + hours
    }, 0)

    return Math.round(totalHours * 10) / 10 // Round to 1 decimal
}

/**
 * Get comprehensive NDIS hours summary for a client
 */
export async function getNDISHoursSummary(clientId: string): Promise<NDISHoursSummary> {
    const requirements = await prisma.clientRequirement.findUnique({
        where: { clientId }
    })

    const usedHours = await calculateClientHoursUsed(
        clientId,
        requirements?.ndisPlanStartDate || undefined,
        requirements?.ndisPlanEndDate || undefined
    )

    const allocatedHours = requirements?.ndisAllocatedHours || null
    const remainingHours = allocatedHours ? allocatedHours - usedHours : null
    const percentageUsed = allocatedHours ? (usedHours / allocatedHours) * 100 : null

    return {
        clientId,
        allocatedHours,
        usedHours,
        remainingHours,
        percentageUsed: percentageUsed ? Math.round(percentageUsed) : null,
        planStartDate: requirements?.ndisPlanStartDate || null,
        planEndDate: requirements?.ndisPlanEndDate || null,
        isApproachingLimit: percentageUsed ? percentageUsed > 80 : false,
        isExceeded: percentageUsed ? percentageUsed > 100 : false
    }
}

/**
 * Update client hours tracking after shift creation/deletion
 */
export async function updateClientHoursTracking(clientId: string): Promise<void> {
    const summary = await getNDISHoursSummary(clientId)

    await prisma.clientRequirement.update({
        where: { clientId },
        data: {
            hoursUsedThisPeriod: summary.usedHours,
            hoursRemainingThisPeriod: summary.remainingHours,
            lastHoursUpdate: new Date()
        }
    })
}

/**
 * Calculate shift cost based on category and duration
 */
export function calculateShiftCost(
    duration: number, // in hours
    shiftCategory: string,
    hourlyRate: number
): number {
    switch (shiftCategory) {
        case 'ACTIVE':
            return duration * hourlyRate
        case 'SLEEPOVER':
            return 150 // Flat rate for sleepover
        case 'OVERNIGHT':
            return duration * hourlyRate * 1.5 // 50% loading for overnight
        case 'RESPITE':
            return duration * hourlyRate
        case 'TRANSPORT':
            return duration * hourlyRate * 0.8 // 20% discount for transport only
        default:
            return duration * hourlyRate
    }
}

/**
 * Get NDIS line item based on shift category and support ratio
 */
export function getNDISLineItem(
    shiftCategory: string,
    supportRatio: string,
    isWeekend: boolean = false
): string {
    // Simplified NDIS line item mapping
    // In production, this would be more comprehensive

    if (shiftCategory === 'SLEEPOVER') {
        return '01_013_0107_1_1' // Sleepover support
    }

    if (shiftCategory === 'OVERNIGHT') {
        return '01_012_0107_1_1' // Overnight support
    }

    if (supportRatio === 'TWO_TO_ONE' || supportRatio === 'THREE_TO_ONE') {
        return isWeekend ? '01_011_0107_1_2' : '01_011_0107_1_1' // High intensity
    }

    return isWeekend ? '01_005_0107_1_2' : '01_005_0107_1_1' // Standard support
}

/**
 * Get all clients approaching or exceeding NDIS hour limits
 */
export async function getClientsApproachingLimits(
    organisationId: string
): Promise<NDISHoursSummary[]> {
    const clients = await prisma.client.findMany({
        where: { organisationId },
        include: { requirements: true }
    })

    const summaries = await Promise.all(
        clients
            .filter(c => c.requirements?.ndisAllocatedHours)
            .map(c => getNDISHoursSummary(c.id))
    )

    return summaries.filter(s => s.isApproachingLimit || s.isExceeded)
}
