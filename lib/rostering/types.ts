import { ShiftStatus, RosteringRuleType, ModuleType } from '@/generated/prisma/client/enums'

// ============================================================================
// Request/Response DTOs for Rostering API
// ============================================================================

// Shift Management DTOs
export interface CreateShiftDto {
    startTime: string // ISO 8601 datetime
    endTime: string // ISO 8601 datetime
    workerIds: string[] // Array of worker user IDs
    clientIds?: string[] // Array of client IDs (optional for some shifts)
    siteId?: string // Optional site reference (for SIL)
    serviceType?: string
    location?: string
    status?: ShiftStatus
}

export interface UpdateShiftDto {
    startTime?: string
    endTime?: string
    workerIds?: string[] // Replace all workers
    clientIds?: string[] // Replace all clients
    siteId?: string
    serviceType?: string
    location?: string
    status?: ShiftStatus
}

export interface ShiftResponseDto {
    id: string
    startTime: string
    endTime: string
    status: ShiftStatus
    serviceType: string | null
    location: string | null
    workers: WorkerSummary[]
    clients: ClientSummary[]
    site: SiteSummary | null
    clockInTime: string | null
    clockOutTime: string | null
    progressNotesCount?: number
    observationsCount?: number
}

export interface WorkerSummary {
    id: string
    name: string
    email: string
    qualifications?: string[]
}

export interface ClientSummary {
    id: string
    name: string
    ndisNumber: string | null
    enabledModules?: ModuleType[]
}

export interface SiteSummary {
    id: string
    name: string
    address: string | null
}

// Worker Availability DTOs
export interface CreateAvailabilityDto {
    workerId: string
    date: string // ISO 8601 date (YYYY-MM-DD)
    startTime: string // ISO 8601 datetime
    endTime: string // ISO 8601 datetime
    isAvailable: boolean
    notes?: string
}

export interface UpdateAvailabilityDto {
    date?: string
    startTime?: string
    endTime?: string
    isAvailable?: boolean
    notes?: string
}

export interface AvailabilityResponseDto {
    id: string
    workerId: string
    workerName: string
    date: string
    startTime: string
    endTime: string
    isAvailable: boolean
    notes: string | null
}

// Rostering Rule DTOs
export interface CreateRosteringRuleDto {
    name: string
    description?: string
    type: RosteringRuleType
    ruleJson: RuleJsonStructure
    isActive?: boolean
}

export interface UpdateRosteringRuleDto {
    name?: string
    description?: string
    type?: RosteringRuleType
    ruleJson?: RuleJsonStructure
    isActive?: boolean
}

export interface RosteringRuleResponseDto {
    id: string
    name: string
    description: string | null
    type: RosteringRuleType
    ruleJson: RuleJsonStructure
    isActive: boolean
    createdAt: string
    updatedAt: string
}

// ============================================================================
// Rule JSON Structures (by type)
// ============================================================================

export type RuleJsonStructure =
    | MaxHoursRule
    | MinBreakRule
    | QualificationRule
    | PreferenceRule
    | ComplianceRule

export interface MaxHoursRule {
    type: 'max_hours'
    maxHoursPerDay?: number
    maxHoursPerWeek?: number
    maxConsecutiveDays?: number
    applyToAllWorkers?: boolean
    workerIds?: string[]
}

export interface MinBreakRule {
    type: 'min_break'
    minBreakMinutes: number
    betweenShiftsSameDay?: boolean
    applyToAllWorkers?: boolean
    workerIds?: string[]
}

export interface QualificationRule {
    type: 'qualification_required'
    requiredQualifications: string[]
    clientIds?: string[] // If specific to certain clients
    serviceTypes?: string[] // If specific to service types
}

export interface PreferenceRule {
    type: 'preference'
    preferredWorkerIds?: string[] // Client prefers these workers
    excludedWorkerIds?: string[] // Client excludes these workers
    preferredDaysOfWeek?: number[] // 0-6 (Sunday-Saturday)
    preferredTimeSlots?: TimeSlot[]
    clientIds?: string[]
    workerIds?: string[]
}

export interface ComplianceRule {
    type: 'compliance'
    ruleName: string
    ruleDescription: string
    constraints: Record<string, any> // Flexible structure for compliance rules
}

export interface TimeSlot {
    startTime: string // HH:MM format
    endTime: string // HH:MM format
}

// ============================================================================
// Roster Suggestion DTOs
// ============================================================================

export interface RosterSuggestionRequestDto {
    startDate: string // ISO 8601 date
    endDate: string // ISO 8601 date
    clientIds?: string[] // Specific clients to roster for
    workerIds?: string[] // Available workers pool
    siteId?: string // Specific site
    constraints?: string[] // Specific rule IDs to apply
    existingShiftIds?: string[] // Consider existing shifts
}

export interface RosterSuggestionResponseDto {
    suggestions: SuggestedShift[]
    conflicts: Conflict[]
    confidenceScore: number // 0-1
    explanation?: string // Natural language explanation
    metadata: {
        totalSuggestedShifts: number
        workersUtilized: number
        clientsCovered: number
    }
}

export interface SuggestedShift {
    startTime: string
    endTime: string
    workerIds: string[]
    clientIds: string[]
    siteId?: string
    serviceType: string
    matchScore: number // 0-100
    reasoning?: string
}

export interface Conflict {
    type: 'availability' | 'qualification' | 'rule_violation' | 'overlap'
    severity: 'low' | 'medium' | 'high'
    shiftId?: string
    workerId?: string
    clientId?: string
    ruleId?: string
    message: string
    suggestedResolution?: string
}

// ============================================================================
// Roster Validation DTOs
// ============================================================================

export interface RosterValidationRequestDto {
    shifts: ValidateShiftDto[]
    ruleIds?: string[] // Specific rules to validate against, or all if not provided
    includeWarnings?: boolean
}

export interface ValidateShiftDto {
    id?: string // Existing shift ID if updating
    startTime: string
    endTime: string
    workerIds: string[]
    clientIds: string[]
    siteId?: string
    serviceType?: string
}

export interface RosterValidationResponseDto {
    isValid: boolean
    conflicts: Conflict[]
    warnings: Conflict[]
    validationSummary: {
        totalShiftsValidated: number
        hardConstraintViolations: number
        softPreferenceWarnings: number
        complianceIssues: number
    }
    llmInsights?: string // Future: Gemini-powered insights
}

// ============================================================================
// Helper Types
// ============================================================================

export interface DateRange {
    startDate: string
    endDate: string
}

export interface TimeRange {
    startTime: string
    endTime: string
}

export interface WorkerWithAvailability extends WorkerSummary {
    availability: AvailabilityResponseDto[]
    totalHoursThisWeek?: number
    assignedShiftsCount?: number
}

export interface ClientWithNeeds extends ClientSummary {
    requiredQualifications?: string[]
    preferredWorkers?: string[]
    excludedWorkers?: string[]
    scheduledShiftsCount?: number
}
