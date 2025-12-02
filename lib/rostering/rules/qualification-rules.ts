import { RuleViolation, RuleCategory, ShiftData, WorkerData, ClientData } from '../rules-engine'
import { CredentialType } from '@/generated/prisma/client/enums'

/**
 * Qualification & Compliance Rules
 * 
 * Validates:
 * - Credential expiry (30-day warning)
 * - High-intensity support matching
 * - Required document verification
 * - NDIS Worker Screening validity
 */

// ============================================================================
// Constants
// ============================================================================

const EXPIRY_WARNING_DAYS = 30
const CRITICAL_CREDENTIALS: CredentialType[] = [
    CredentialType.NDIS_WORKER_SCREENING,
    CredentialType.WORKING_WITH_CHILDREN,
    CredentialType.FIRST_AID_CPR
]

const HIGH_INTENSITY_CREDENTIAL_MAP: Record<string, CredentialType> = {
    'CATHETER': CredentialType.HIGH_INTENSITY_CATHETER,
    'PEG': CredentialType.HIGH_INTENSITY_PEG,
    'DIABETES': CredentialType.HIGH_INTENSITY_DIABETES,
    'SEIZURE': CredentialType.HIGH_INTENSITY_SEIZURE,
    'BEHAVIOUR': CredentialType.HIGH_INTENSITY_BEHAVIOUR
}

// ============================================================================
// Validation Functions
// ============================================================================

export async function validateQualifications(
    shift: ShiftData,
    worker: WorkerData,
    client: ClientData
): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = []

    // Check credential expiry
    violations.push(...checkCredentialExpiry(worker))

    // Check critical credentials exist
    violations.push(...checkCriticalCredentials(worker))

    // Check high-intensity matching
    if (shift.isHighIntensity && client.requirements?.requiresHighIntensity) {
        violations.push(...checkHighIntensityMatch(worker, client))
    }

    // Check manual handling requirements
    if (client.requirements?.requiresTransfers) {
        violations.push(...checkManualHandlingCredentials(worker))
    }

    // Check PBS training for BSP clients
    if (client.requirements?.requiresBSP && client.requirements?.bspRequiresPBS) {
        violations.push(...checkPBSTraining(worker))
    }

    return violations
}

/**
 * Check if worker credentials are expired or expiring soon
 */
function checkCredentialExpiry(worker: WorkerData): RuleViolation[] {
    const violations: RuleViolation[] = []
    const now = new Date()

    if (!worker.credentials || worker.credentials.length === 0) {
        return violations
    }

    worker.credentials.forEach(credential => {
        if (!credential.expiryDate) return // No expiry date means it doesn't expire

        const daysUntilExpiry = Math.floor(
            (credential.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Already expired - HARD constraint
        if (daysUntilExpiry < 0) {
            violations.push({
                ruleId: 'QUAL_001_EXPIRED',
                severity: 'HARD',
                category: RuleCategory.QUALIFICATION,
                message: `Worker's ${formatCredentialType(credential.type)} expired ${Math.abs(daysUntilExpiry)} days ago`,
                affectedEntity: worker.id,
                suggestedResolution: `Renew ${formatCredentialType(credential.type)} or assign different worker`,
                details: {
                    credentialType: credential.type,
                    expiryDate: credential.expiryDate,
                    daysOverdue: Math.abs(daysUntilExpiry)
                }
            })
        }
        // Expiring soon - SOFT warning
        else if (daysUntilExpiry <= EXPIRY_WARNING_DAYS) {
            const severity = CRITICAL_CREDENTIALS.includes(credential.type) ? 'HARD' : 'SOFT'
            violations.push({
                ruleId: 'QUAL_002_EXPIRING',
                severity,
                category: RuleCategory.QUALIFICATION,
                message: `Worker's ${formatCredentialType(credential.type)} expires in ${daysUntilExpiry} days`,
                affectedEntity: worker.id,
                suggestedResolution: `Schedule renewal for ${formatCredentialType(credential.type)}`,
                details: {
                    credentialType: credential.type,
                    expiryDate: credential.expiryDate,
                    daysRemaining: daysUntilExpiry
                }
            })
        }
    })

    return violations
}

/**
 * Check that worker has all critical credentials
 */
function checkCriticalCredentials(worker: WorkerData): RuleViolation[] {
    const violations: RuleViolation[] = []

    if (!worker.credentials) {
        violations.push({
            ruleId: 'QUAL_003_NO_CREDENTIALS',
            severity: 'HARD',
            category: RuleCategory.QUALIFICATION,
            message: 'Worker has no credentials on file',
            affectedEntity: worker.id,
            suggestedResolution: 'Add worker credentials before assigning shifts'
        })
        return violations
    }

    const workerCredentialTypes = worker.credentials.map(c => c.type)

    CRITICAL_CREDENTIALS.forEach(requiredType => {
        if (!workerCredentialTypes.includes(requiredType)) {
            violations.push({
                ruleId: 'QUAL_004_MISSING_CRITICAL',
                severity: 'HARD',
                category: RuleCategory.QUALIFICATION,
                message: `Worker missing required ${formatCredentialType(requiredType)}`,
                affectedEntity: worker.id,
                suggestedResolution: `Add ${formatCredentialType(requiredType)} credential`,
                details: { missingCredential: requiredType }
            })
        }
    })

    return violations
}

/**
 * Check high-intensity support matching
 */
function checkHighIntensityMatch(worker: WorkerData, client: ClientData): RuleViolation[] {
    const violations: RuleViolation[] = []

    if (!client.requirements?.highIntensityTypes || client.requirements.highIntensityTypes.length === 0) {
        return violations
    }

    const workerCredentialTypes = worker.credentials?.map(c => c.type) || []

    client.requirements.highIntensityTypes.forEach(hiType => {
        const requiredCredential = HIGH_INTENSITY_CREDENTIAL_MAP[hiType]

        if (!requiredCredential) {
            // Unknown high-intensity type
            return
        }

        if (!workerCredentialTypes.includes(requiredCredential)) {
            violations.push({
                ruleId: 'QUAL_005_HIGH_INTENSITY',
                severity: 'HARD',
                category: RuleCategory.QUALIFICATION,
                message: `Worker not qualified for high-intensity ${hiType.toLowerCase()} support`,
                affectedEntity: worker.id,
                suggestedResolution: `Assign worker with ${formatCredentialType(requiredCredential)} or provide training`,
                details: {
                    requiredCredential,
                    highIntensityType: hiType
                }
            })
        }
    })

    return violations
}

/**
 * Check manual handling credentials
 */
function checkManualHandlingCredentials(worker: WorkerData): RuleViolation[] {
    const violations: RuleViolation[] = []
    const workerCredentialTypes = worker.credentials?.map(c => c.type) || []

    if (!workerCredentialTypes.includes(CredentialType.MANUAL_HANDLING)) {
        violations.push({
            ruleId: 'QUAL_006_MANUAL_HANDLING',
            severity: 'HARD',
            category: RuleCategory.QUALIFICATION,
            message: 'Worker missing Manual Handling certification for client requiring transfers',
            affectedEntity: worker.id,
            suggestedResolution: 'Assign worker with Manual Handling certification or provide training',
            details: { requiredCredential: CredentialType.MANUAL_HANDLING }
        })
    }

    return violations
}

/**
 * Check PBS training for behaviour support plans
 */
function checkPBSTraining(worker: WorkerData): RuleViolation[] {
    const violations: RuleViolation[] = []
    const workerCredentialTypes = worker.credentials?.map(c => c.type) || []

    if (!workerCredentialTypes.includes(CredentialType.PBS_TRAINING)) {
        violations.push({
            ruleId: 'QUAL_007_PBS',
            severity: 'HARD',
            category: RuleCategory.QUALIFICATION,
            message: 'Worker missing PBS training required for client with Behaviour Support Plan',
            affectedEntity: worker.id,
            suggestedResolution: 'Assign worker with PBS training or provide training',
            details: { requiredCredential: CredentialType.PBS_TRAINING }
        })
    }

    return violations
}

/**
 * Check if credentials are verified
 */
export function checkCredentialVerification(worker: WorkerData): RuleViolation[] {
    const violations: RuleViolation[] = []

    if (!worker.credentials) return violations

    const unverifiedCritical = worker.credentials.filter(
        c => CRITICAL_CREDENTIALS.includes(c.type) && !c.verified
    )

    unverifiedCritical.forEach(credential => {
        violations.push({
            ruleId: 'QUAL_008_UNVERIFIED',
            severity: 'SOFT',
            category: RuleCategory.QUALIFICATION,
            message: `Worker's ${formatCredentialType(credential.type)} has not been verified`,
            affectedEntity: worker.id,
            suggestedResolution: 'Verify credential documentation',
            details: { credentialType: credential.type }
        })
    })

    return violations
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCredentialType(type: CredentialType): string {
    const formatted = type.replace(/_/g, ' ')
    return formatted.split(' ')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ')
}
