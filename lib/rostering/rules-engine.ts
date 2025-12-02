import prisma from '@/lib/prisma'
import { CredentialType, RiskLevel, ShiftType } from '@/generated/prisma/client/enums'

/**
 * NDIS Rostering Rules Engine
 * 
 * Validates shift assignments against:
 * - NDIS Practice Standards
 * - SCHADS Award requirements
 * - WHS Safety laws
 * - NDIS Support Delivery rules
 * - Organizational policies
 * - Billing & Costing rules
 */

// ============================================================================
// Core Types
// ============================================================================

export interface RuleViolation {
    ruleId: string
    severity: 'HARD' | 'SOFT'
    category: RuleCategory
    message: string
    affectedEntity?: string
    suggestedResolution?: string
    details?: any
}

export enum RuleCategory {
    QUALIFICATION = 'QUALIFICATION',
    SCHADS_AWARD = 'SCHADS_AWARD',
    WHS_SAFETY = 'WHS_SAFETY',
    NDIS_COMPLIANCE = 'NDIS_COMPLIANCE',
    ORGANIZATIONAL = 'ORGANIZATIONAL',
    BILLING = 'BILLING'
}

export interface ShiftData {
    id?: string
    startTime: Date
    endTime: Date
    shiftType: ShiftType
    isHighIntensity: boolean
    requiresTransport: boolean
    travelDistance?: number
    location?: string
    serviceType?: string
    siteId?: string
}

export interface WorkerData {
    id: string
    name: string
    email: string
    qualifications: string[]
    credentials?: WorkerCredentialData[]
    maxFortnightlyHours?: number
}

export interface WorkerCredentialData {
    id: string
    type: CredentialType
    issueDate: Date
    expiryDate?: Date
    verified: boolean
}

export interface ClientData {
    id: string
    name: string
    requirements?: ClientRequirementData
}

export interface ClientRequirementData {
    requiresHighIntensity: boolean
    highIntensityTypes: string[]
    genderPreference?: string
    bannedWorkerIds: string[]
    preferredWorkerIds: string[]
    requiresBSP: boolean
    bspRequires2to1: boolean
    bspRequiredGender?: string
    bspRequiresPBS: boolean
    requiresTransfers: boolean
    riskLevel: RiskLevel
}

export interface DateRange {
    startDate: Date
    endDate: Date
}

export interface CostBreakdown {
    baseRate: number
    penaltyMultiplier: number
    totalHours: number
    totalCost: number
    shiftType: ShiftType
    breakdown: {
        standardHours: number
        overtimeHours: number
        penaltyHours: number
    }
}

// ============================================================================
// Main Rules Engine Class
// ============================================================================

export class RosteringRulesEngine {
    /**
     * Validate a shift assignment against all applicable rules
     */
    async validateShiftAssignment(
        shift: ShiftData,
        worker: WorkerData,
        client: ClientData
    ): Promise<RuleViolation[]> {
        const violations: RuleViolation[] = []

        // Import rule validators dynamically to avoid circular dependencies
        const { validateQualifications } = await import('./rules/qualification-rules')
        const { validateSCHADSCompliance } = await import('./rules/schads-rules')
        const { validateWHSSafety } = await import('./rules/whs-rules')
        const { validateNDISCompliance } = await import('./rules/ndis-rules')
        const { validateOrganizationalRules } = await import('./rules/organizational-rules')

        // Run all validation checks
        violations.push(...await validateQualifications(shift, worker, client))
        violations.push(...await validateSCHADSCompliance(shift, worker))
        violations.push(...await validateWHSSafety(shift, worker))
        violations.push(...await validateNDISCompliance(shift, worker, client))
        violations.push(...await validateOrganizationalRules(shift, worker, client))

        return violations
    }

    /**
     * Validate a worker's entire schedule for a date range
     */
    async validateWorkerSchedule(
        workerId: string,
        dateRange: DateRange
    ): Promise<RuleViolation[]> {
        const violations: RuleViolation[] = []

        // Fetch all shifts for this worker in the date range
        const shifts = await prisma.shift.findMany({
            where: {
                shiftWorkerLink: {
                    some: { workerId }
                },
                startTime: {
                    gte: dateRange.startDate,
                    lte: dateRange.endDate
                }
            },
            include: {
                shiftWorkerLink: {
                    include: {
                        worker: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                qualifications: true,
                                workerCredentials: true
                            }
                        }
                    }
                },
                shiftClientLink: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                name: true,
                                requirements: true
                            }
                        }
                    }
                }
            },
            orderBy: { startTime: 'asc' }
        })

        // Get worker data
        const worker = await prisma.user.findUnique({
            where: { id: workerId },
            include: { workerCredentials: true }
        })

        if (!worker) {
            violations.push({
                ruleId: 'WORKER_NOT_FOUND',
                severity: 'HARD',
                category: RuleCategory.ORGANIZATIONAL,
                message: 'Worker not found',
                affectedEntity: workerId
            })
            return violations
        }

        const workerData: WorkerData = {
            id: worker.id,
            name: worker.name,
            email: worker.email,
            qualifications: worker.qualifications,
            credentials: worker.workerCredentials.map(c => ({
                id: c.id,
                type: c.type,
                issueDate: c.issueDate,
                expiryDate: c.expiryDate || undefined,
                verified: c.verified
            }))
        }

        // Validate schedule-level rules (fatigue, hours, breaks)
        const { validateScheduleRules } = await import('./rules/schads-rules')
        const { validateFatigueManagement } = await import('./rules/whs-rules')

        violations.push(...await validateScheduleRules(shifts, workerData))
        violations.push(...await validateFatigueManagement(shifts, workerData))

        return violations
    }

    /**
     * Calculate the cost of a shift including penalty rates
     */
    async calculateShiftCost(shift: ShiftData): Promise<CostBreakdown> {
        const { calculateCost } = await import('./rules/billing-rules')
        return calculateCost(shift)
    }

    /**
     * Check if a violation can be overridden
     */
    canOverride(violation: RuleViolation): boolean {
        // Hard constraints cannot be overridden
        if (violation.severity === 'HARD') {
            // Exception: Some organizational rules can be overridden with approval
            if (violation.category === RuleCategory.ORGANIZATIONAL) {
                return true
            }
            return false
        }

        // Soft constraints can always be overridden
        return true
    }

    /**
     * Get all violations grouped by severity and category
     */
    groupViolations(violations: RuleViolation[]): {
        hard: Map<RuleCategory, RuleViolation[]>
        soft: Map<RuleCategory, RuleViolation[]>
    } {
        const hard = new Map<RuleCategory, RuleViolation[]>()
        const soft = new Map<RuleCategory, RuleViolation[]>()

        violations.forEach(violation => {
            const map = violation.severity === 'HARD' ? hard : soft
            const category = violation.category

            if (!map.has(category)) {
                map.set(category, [])
            }
            map.get(category)!.push(violation)
        })

        return { hard, soft }
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const rulesEngine = new RosteringRulesEngine()
