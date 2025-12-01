import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { RosteringRuleType } from '@/generated/prisma/client/enums'
import type { CreateRosteringRuleDto, RosteringRuleResponseDto } from '@/lib/rostering/types'

/**
 * GET /api/v1/rostering/rules
 * Get rostering rules for the organization
 */
export async function GET(request: NextRequest) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') as RosteringRuleType | null
        const isActive = searchParams.get('isActive')

        const where: any = {
            organisationId: context!.organisationId
        }

        if (type && Object.values(RosteringRuleType).includes(type)) {
            where.type = type
        }

        if (isActive !== null) {
            where.isActive = isActive === 'true'
        }

        const rules = await prisma.rosteringRule.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        })

        const response: RosteringRuleResponseDto[] = rules.map(rule => ({
            id: rule.id,
            name: rule.name,
            description: rule.description,
            type: rule.type,
            ruleJson: rule.ruleJson as any,
            isActive: rule.isActive,
            createdAt: rule.createdAt.toISOString(),
            updatedAt: rule.updatedAt.toISOString()
        }))

        return successResponse({ rules: response })
    } catch (err) {
        console.error('Error fetching rostering rules:', err)
        return errorResponse('Failed to fetch rostering rules', 'INTERNAL_ERROR', 500)
    }
}

/**
 * POST /api/v1/rostering/rules
 * Create a new rostering rule
 */
export async function POST(request: NextRequest) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const body: CreateRosteringRuleDto = await request.json()

        // Validate required fields
        if (!body.name || !body.type || !body.ruleJson) {
            return errorResponse(
                'Missing required fields: name, type, and ruleJson are required',
                'VALIDATION_ERROR',
                400
            )
        }

        // Validate rule type
        if (!Object.values(RosteringRuleType).includes(body.type)) {
            return errorResponse('Invalid rule type', 'VALIDATION_ERROR', 400)
        }

        // Check for duplicate name
        const existing = await prisma.rosteringRule.findFirst({
            where: {
                organisationId: context!.organisationId,
                name: body.name
            }
        })

        if (existing) {
            return errorResponse(
                'A rule with this name already exists',
                'VALIDATION_ERROR',
                400
            )
        }

        // Create rule
        const rule = await prisma.rosteringRule.create({
            data: {
                organisationId: context!.organisationId,
                name: body.name,
                description: body.description,
                type: body.type,
                ruleJson: body.ruleJson as any,
                isActive: body.isActive ?? true
            }
        })

        const response: RosteringRuleResponseDto = {
            id: rule.id,
            name: rule.name,
            description: rule.description,
            type: rule.type,
            ruleJson: rule.ruleJson as any,
            isActive: rule.isActive,
            createdAt: rule.createdAt.toISOString(),
            updatedAt: rule.updatedAt.toISOString()
        }

        return successResponse({ rule: response }, 201)
    } catch (err) {
        console.error('Error creating rostering rule:', err)
        return errorResponse('Failed to create rostering rule', 'INTERNAL_ERROR', 500)
    }
}
