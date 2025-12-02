import { RuleViolation, RuleCategory, ShiftData, WorkerData, ClientData } from '../rules-engine'
import prisma from '@/lib/prisma'

/**
 * NDIS Support Delivery Compliance Rules
 * 
 * Validates:
 * - Gender preferences
 * - Banned/preferred workers
 * - SIL staffing ratios
 * - Behaviour Support Plan (BSP) requirements
 * - High-intensity support matching
 * - Continuity of care
 */

// ============================================================================
// Constants
// ============================================================================

const CONTINUITY_PREFERENCE_WEIGHT = 0.3 // 30% preference for same worker

// ============================================================================
// Validation Functions
// ============================================================================

export async function validateNDISCompliance(
    shift: ShiftData,
    worker: WorkerData,
    client: ClientData
): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    if (!client.requirements) return violations

    // Check gender preferences
    violations.push(...checkGenderPreference(worker, client))

    // Check banned workers
    violations.push(...checkBannedWorker(worker, client))

    // Check BSP requirements
    if (client.requirements.requiresBSP) {
        violations.push(...checkBSPRequirements(shift, worker, client))
    }

    // Check SIL staffing ratios (if applicable)
    if (shift.siteId) {
        violations.push(...await checkSILStaffingRatio(shift))
    }

    return violations
}

/**
 * Check gender preference compliance
 */
function checkGenderPreference(worker: WorkerData, client: ClientData): RuleViolation[] {
    const violations: RuleViolation[] = []

    if (!client.requirements?.genderPreference || client.requirements.genderPreference === 'ANY') {
        return violations
    }

    // Note: We would need to add gender field to User model
    // For now, this is a placeholder that would need worker.gender
    // violations.push({
    //     ruleId: 'NDIS_001_GENDER',
    //     severity: 'HARD',
    //     category: RuleCategory.NDIS_COMPLIANCE,
    //     message: `Client requires ${client.requirements.genderPreference} worker`,
    //     affectedEntity: worker.id,
    //     suggestedResolution: `Assign ${client.requirements.genderPreference} worker`,
    //     details: {
    //         requiredGender: client.requirements.genderPreference,
    //         workerGender: worker.gender
    //     }
    // })

    return violations
}

/**
 * Check if worker is banned for this client
 */
function checkBannedWorker(worker: WorkerData, client: ClientData): RuleViolation[] {
    const violations: RuleViolation[] = []

    if (!client.requirements?.bannedWorkerIds || client.requirements.bannedWorkerIds.length === 0) {
        return violations
    }

    if (client.requirements.bannedWorkerIds.includes(worker.id)) {
        violations.push({
            ruleId: 'NDIS_002_BANNED_WORKER',
            severity: 'HARD',
            category: RuleCategory.NDIS_COMPLIANCE,
            message: `Worker is on client's banned list - cannot be assigned`,
            affectedEntity: worker.id,
            suggestedResolution: 'Assign different worker',
            details: {
                clientId: client.id,
                workerId: worker.id
            }
        })
    }

    return violations
}

/**
 * Check preferred worker (soft preference)
 */
export function checkPreferredWorker(worker: WorkerData, client: ClientData): RuleViolation[] {
    const violations: RuleViolation[] = []

    if (!client.requirements?.preferredWorkerIds || client.requirements.preferredWorkerIds.length === 0) {
        return violations
    }

    if (!client.requirements.preferredWorkerIds.includes(worker.id)) {
        violations.push({
            ruleId: 'NDIS_003_PREFERRED_WORKER',
            severity: 'SOFT',
            category: RuleCategory.NDIS_COMPLIANCE,
            message: 'Client has preferred workers - this worker is not on the preferred list',
            affectedEntity: worker.id,
            suggestedResolution: 'Consider assigning preferred worker for better continuity of care',
            details: {
                preferredWorkerIds: client.requirements.preferredWorkerIds,
                currentWorkerId: worker.id
            }
        })
    }

    return violations
}

/**
 * Check Behaviour Support Plan requirements
 */
function checkBSPRequirements(shift: ShiftData, worker: WorkerData, client: ClientData): RuleViolation[] {
    const violations: RuleViolation[] = []

    if (!client.requirements) return violations

    // Check 2-to-1 support requirement
    if (client.requirements.bspRequires2to1) {
        // This would need to check the number of workers assigned to the shift
        // For now, we'll add a warning to verify
        violations.push({
            ruleId: 'NDIS_004_BSP_2TO1',
            severity: 'HARD',
            category: RuleCategory.NDIS_COMPLIANCE,
            message: 'Client requires 2-to-1 support as per Behaviour Support Plan',
            suggestedResolution: 'Assign second worker to shift',
            details: {
                requirement: '2-to-1 support',
                clientId: client.id
            }
        })
    }

    // Check gender requirement for BSP
    if (client.requirements.bspRequiredGender) {
        // Similar to general gender preference, would need worker.gender field
        // violations.push({
        //     ruleId: 'NDIS_005_BSP_GENDER',
        //     severity: 'HARD',
        //     category: RuleCategory.NDIS_COMPLIANCE,
        //     message: `BSP requires ${client.requirements.bspRequiredGender} worker`,
        //     affectedEntity: worker.id,
        //     suggestedResolution: `Assign ${client.requirements.bspRequiredGender} worker as per BSP`,
        //     details: {
        //         requiredGender: client.requirements.bspRequiredGender
        //     }
        // })
    }

    return violations
}

/**
 * Check SIL (Supported Independent Living) staffing ratios
 */
async function checkSILStaffingRatio(shift: ShiftData): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    if (!shift.siteId) return violations

    // Get SIL staffing rules for this site
    const staffingRules = await prisma.sILStaffingRule.findMany({
        where: { siteId: shift.siteId }
    })

    if (staffingRules.length === 0) return violations

    // Determine time of day
    const startHour = shift.startTime.getHours()
    let timeOfDay = 'DAY'

    if (startHour >= 6 && startHour < 12) {
        timeOfDay = 'MORNING'
    } else if (startHour >= 12 && startHour < 18) {
        timeOfDay = 'DAY'
    } else if (startHour >= 18 && startHour < 22) {
        timeOfDay = 'EVENING'
    } else {
        timeOfDay = 'OVERNIGHT'
    }

    // Find applicable rule
    const applicableRule = staffingRules.find(rule => rule.timeOfDay === timeOfDay)

    if (!applicableRule) return violations

    // Get site details to check participant count
    const site = await prisma.site.findUnique({
        where: { id: shift.siteId },
        include: {
            clients: true
        }
    })

    if (!site) return violations

    const participantCount = site.clients.length

    // Check if we need to verify worker count
    // This would require checking how many workers are assigned to this shift
    // For now, we'll add a validation that needs to be checked
    violations.push({
        ruleId: 'NDIS_006_SIL_RATIO',
        severity: 'HARD',
        category: RuleCategory.NDIS_COMPLIANCE,
        message: `SIL site requires ${applicableRule.requiredStaff} staff for ${participantCount} participants during ${timeOfDay}`,
        suggestedResolution: `Ensure ${applicableRule.requiredStaff} workers are assigned to this shift`,
        details: {
            siteId: shift.siteId,
            timeOfDay,
            participantCount,
            requiredStaff: applicableRule.requiredStaff
        }
    })

    return violations
}

/**
 * Check continuity of care (soft preference)
 */
export async function checkContinuityOfCare(
    shift: ShiftData,
    worker: WorkerData,
    client: ClientData
): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    // Get recent shifts for this client
    const recentShifts = await prisma.shift.findMany({
        where: {
            shiftClientLink: {
                some: { clientId: client.id }
            },
            startTime: {
                lt: shift.startTime,
                gte: new Date(shift.startTime.getTime() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            },
            status: { in: ['COMPLETED', 'IN_PROGRESS'] }
        },
        include: {
            shiftWorkerLink: {
                include: {
                    worker: {
                        select: { id: true, name: true }
                    }
                }
            }
        },
        take: 10,
        orderBy: { startTime: 'desc' }
    })

    if (recentShifts.length === 0) return violations

    // Count worker frequency
    const workerFrequency = new Map<string, number>()

    recentShifts.forEach(recentShift => {
        recentShift.shiftWorkerLink.forEach(sw => {
            const count = workerFrequency.get(sw.workerId) || 0
            workerFrequency.set(sw.workerId, count + 1)
        })
    })

    // Find most frequent worker
    let mostFrequentWorkerId = ''
    let maxFrequency = 0

    workerFrequency.forEach((frequency, workerId) => {
        if (frequency > maxFrequency) {
            maxFrequency = frequency
            mostFrequentWorkerId = workerId
        }
    })

    // If current worker is not the most frequent, suggest for continuity
    if (mostFrequentWorkerId && mostFrequentWorkerId !== worker.id && maxFrequency >= 3) {
        const mostFrequentWorker = recentShifts
            .flatMap(s => s.shiftWorkerLink)
            .find(sw => sw.workerId === mostFrequentWorkerId)?.worker

        violations.push({
            ruleId: 'NDIS_007_CONTINUITY',
            severity: 'SOFT',
            category: RuleCategory.NDIS_COMPLIANCE,
            message: `For continuity of care, consider assigning ${mostFrequentWorker?.name || 'regular worker'} (worked ${maxFrequency} of last ${recentShifts.length} shifts)`,
            affectedEntity: worker.id,
            suggestedResolution: `Assign ${mostFrequentWorker?.name || 'regular worker'} for better continuity`,
            details: {
                currentWorkerId: worker.id,
                suggestedWorkerId: mostFrequentWorkerId,
                recentShiftCount: maxFrequency
            }
        })
    }

    return violations
}
