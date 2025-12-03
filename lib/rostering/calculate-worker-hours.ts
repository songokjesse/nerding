/**
 * Worker Hours Calculation Utilities
 * 
 * Calculates total hours worked by workers within a fortnight period
 * for visual display in calendar and hour limit tracking
 */

export interface WorkerHoursInfo {
    workerId: string
    totalHours: number
    maxHours: number | null
    exceeds: boolean
    percentage: number
}

/**
 * Calculate total hours worked by a worker in a rolling 14-day window
 */
export function calculateWorkerFortnightlyHours(
    shifts: any[],
    workerId: string,
    referenceDate: Date = new Date()
): number {
    const fortnightStart = new Date(referenceDate)
    fortnightStart.setDate(referenceDate.getDate() - 13) // 14-day window

    const workerShifts = shifts.filter(s => {
        const hasWorker = s.shiftWorkerLink?.some((sw: any) => sw.workerId === workerId)
        const inWindow = s.startTime >= fortnightStart && s.startTime <= referenceDate
        return hasWorker && inWindow
    })

    return workerShifts.reduce((total, shift) => {
        const hours = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60)
        return total + hours
    }, 0)
}

/**
 * Get hours map for all workers in the shift list
 */
export function getWorkerHoursMap(
    shifts: any[],
    workers: Array<{ id: string; maxFortnightlyHours: number | null }>
): Record<string, WorkerHoursInfo> {
    const hoursMap: Record<string, WorkerHoursInfo> = {}
    const now = new Date()

    workers.forEach(worker => {
        const totalHours = calculateWorkerFortnightlyHours(shifts, worker.id, now)
        const maxHours = worker.maxFortnightlyHours
        const exceeds = maxHours ? totalHours > maxHours : false
        const percentage = maxHours ? (totalHours / maxHours) * 100 : 0

        hoursMap[worker.id] = {
            workerId: worker.id,
            totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
            maxHours,
            exceeds,
            percentage: Math.round(percentage)
        }
    })

    return hoursMap
}

/**
 * Format hours display for calendar
 */
export function formatHoursDisplay(info: WorkerHoursInfo): string {
    if (!info.maxHours) {
        return `${info.totalHours}h`
    }

    const warning = info.exceeds ? '⚠️ ' : ''
    return `${warning}${info.totalHours}/${info.maxHours}h`
}
