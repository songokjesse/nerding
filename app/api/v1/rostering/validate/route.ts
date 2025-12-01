import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { validateShifts } from '@/lib/rostering/validation'
import type { RosterValidationRequestDto, RosterValidationResponseDto, Conflict } from '@/lib/rostering/types'

/**
 * POST /api/v1/rostering/validate
 * Validate proposed roster against rostering rules
 */
export async function POST(request: NextRequest) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const body: RosterValidationRequestDto = await request.json()

        if (!body.shifts || body.shifts.length === 0) {
            return errorResponse('At least one shift is required for validation', 'VALIDATION_ERROR', 400)
        }

        // Get rostering rules
        const rules = body.ruleIds && body.ruleIds.length > 0
            ? await prisma.rosteringRule.findMany({
                where: {
                    id: { in: body.ruleIds },
                    organisationId: context!.organisationId,
                    isActive: true
                }
            })
            : await prisma.rosteringRule.findMany({
                where: {
                    organisationId: context!.organisationId,
                    isActive: true
                }
            })

        // Get worker qualifications
        const workerIds = [...new Set(body.shifts.flatMap(s => s.workerIds))]
        const workers = await prisma.user.findMany({
            where: {
                id: { in: workerIds },
                organisationMemberships: {
                    some: {
                        organisationId: context!.organisationId
                    }
                }
            },
            select: {
                id: true,
                qualifications: true
            }
        })

        const workerQualifications = new Map(
            workers.map(w => [w.id, w.qualifications])
        )

        // Perform validation
        const allConflicts = validateShifts(
            body.shifts,
            rules.map(r => ({
                id: r.id,
                name: r.name,
                description: r.description,
                type: r.type,
                ruleJson: r.ruleJson as any,
                isActive: r.isActive,
                createdAt: r.createdAt.toISOString(),
                updatedAt: r.updatedAt.toISOString()
            })),
            workerQualifications,
            body.includeWarnings ?? true
        )

        // Separate conflicts and warnings
        const conflicts: Conflict[] = allConflicts.filter(c => c.severity === 'high')
        const warnings: Conflict[] = allConflicts.filter(c => c.severity !== 'high')

        // Count violations by type
        const hardConstraintViolations = conflicts.filter(c => c.type === 'rule_violation').length
        const complianceIssues = conflicts.filter(c => c.type === 'qualification').length
        const softPreferenceWarnings = warnings.length

        const response: RosterValidationResponseDto = {
            isValid: conflicts.length === 0,
            conflicts,
            warnings,
            validationSummary: {
                totalShiftsValidated: body.shifts.length,
                hardConstraintViolations,
                softPreferenceWarnings,
                complianceIssues
            }
        }

        return successResponse(response)
    } catch (err) {
        console.error('Error validating roster:', err)
        return errorResponse('Failed to validate roster', 'INTERNAL_ERROR', 500)
    }
}
