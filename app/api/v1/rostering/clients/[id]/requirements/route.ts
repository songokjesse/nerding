import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { RiskLevel } from '@/generated/prisma/client/enums'

/**
 * GET /api/v1/rostering/clients/[id]/requirements
 * Get requirements for a client
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const clientId = params.id

        // Verify client belongs to organization
        const client = await prisma.client.findFirst({
            where: {
                id: clientId,
                organisationId: context!.organisationId
            },
            include: {
                requirements: true
            }
        })

        if (!client) {
            return errorResponse('Client not found', 'NOT_FOUND', 404)
        }

        if (!client.requirements) {
            return successResponse({ requirements: null })
        }

        const requirements = {
            id: client.requirements.id,
            requiresHighIntensity: client.requirements.requiresHighIntensity,
            highIntensityTypes: client.requirements.highIntensityTypes,
            genderPreference: client.requirements.genderPreference,
            bannedWorkerIds: client.requirements.bannedWorkerIds,
            preferredWorkerIds: client.requirements.preferredWorkerIds,
            requiresBSP: client.requirements.requiresBSP,
            bspRequires2to1: client.requirements.bspRequires2to1,
            bspRequiredGender: client.requirements.bspRequiredGender,
            bspRequiresPBS: client.requirements.bspRequiresPBS,
            requiresTransfers: client.requirements.requiresTransfers,
            riskLevel: client.requirements.riskLevel,
            createdAt: client.requirements.createdAt.toISOString(),
            updatedAt: client.requirements.updatedAt.toISOString()
        }

        return successResponse({ requirements })
    } catch (err) {
        console.error('Error fetching client requirements:', err)
        return errorResponse('Failed to fetch requirements', 'INTERNAL_ERROR', 500)
    }
}

/**
 * POST /api/v1/rostering/clients/[id]/requirements
 * Create requirements for a client
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const clientId = params.id
        const body = await request.json()

        // Verify client belongs to organization
        const client = await prisma.client.findFirst({
            where: {
                id: clientId,
                organisationId: context!.organisationId
            },
            include: {
                requirements: true
            }
        })

        if (!client) {
            return errorResponse('Client not found', 'NOT_FOUND', 404)
        }

        // Check if requirements already exist
        if (client.requirements) {
            return errorResponse(
                'Requirements already exist for this client. Use PUT to update.',
                'VALIDATION_ERROR',
                400
            )
        }

        // Validate risk level if provided
        if (body.riskLevel && !Object.values(RiskLevel).includes(body.riskLevel)) {
            return errorResponse('Invalid risk level', 'VALIDATION_ERROR', 400)
        }

        // Create requirements
        const requirements = await prisma.clientRequirement.create({
            data: {
                clientId,
                requiresHighIntensity: body.requiresHighIntensity || false,
                highIntensityTypes: body.highIntensityTypes || [],
                genderPreference: body.genderPreference,
                bannedWorkerIds: body.bannedWorkerIds || [],
                preferredWorkerIds: body.preferredWorkerIds || [],
                requiresBSP: body.requiresBSP || false,
                bspRequires2to1: body.bspRequires2to1 || false,
                bspRequiredGender: body.bspRequiredGender,
                bspRequiresPBS: body.bspRequiresPBS || false,
                requiresTransfers: body.requiresTransfers || false,
                riskLevel: body.riskLevel || RiskLevel.LOW
            }
        })

        return successResponse({
            requirements: {
                id: requirements.id,
                requiresHighIntensity: requirements.requiresHighIntensity,
                highIntensityTypes: requirements.highIntensityTypes,
                genderPreference: requirements.genderPreference,
                bannedWorkerIds: requirements.bannedWorkerIds,
                preferredWorkerIds: requirements.preferredWorkerIds,
                requiresBSP: requirements.requiresBSP,
                bspRequires2to1: requirements.bspRequires2to1,
                bspRequiredGender: requirements.bspRequiredGender,
                bspRequiresPBS: requirements.bspRequiresPBS,
                requiresTransfers: requirements.requiresTransfers,
                riskLevel: requirements.riskLevel,
                createdAt: requirements.createdAt.toISOString(),
                updatedAt: requirements.updatedAt.toISOString()
            }
        }, 201)
    } catch (err) {
        console.error('Error creating client requirements:', err)
        return errorResponse('Failed to create requirements', 'INTERNAL_ERROR', 500)
    }
}

/**
 * PUT /api/v1/rostering/clients/[id]/requirements
 * Update requirements for a client
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const clientId = params.id
        const body = await request.json()

        // Verify client belongs to organization and has requirements
        const client = await prisma.client.findFirst({
            where: {
                id: clientId,
                organisationId: context!.organisationId
            },
            include: {
                requirements: true
            }
        })

        if (!client) {
            return errorResponse('Client not found', 'NOT_FOUND', 404)
        }

        if (!client.requirements) {
            return errorResponse(
                'No requirements found for this client. Use POST to create.',
                'NOT_FOUND',
                404
            )
        }

        // Validate risk level if provided
        if (body.riskLevel && !Object.values(RiskLevel).includes(body.riskLevel)) {
            return errorResponse('Invalid risk level', 'VALIDATION_ERROR', 400)
        }

        // Update requirements
        const updated = await prisma.clientRequirement.update({
            where: { id: client.requirements.id },
            data: {
                ...(body.requiresHighIntensity !== undefined && { requiresHighIntensity: body.requiresHighIntensity }),
                ...(body.highIntensityTypes !== undefined && { highIntensityTypes: body.highIntensityTypes }),
                ...(body.genderPreference !== undefined && { genderPreference: body.genderPreference }),
                ...(body.bannedWorkerIds !== undefined && { bannedWorkerIds: body.bannedWorkerIds }),
                ...(body.preferredWorkerIds !== undefined && { preferredWorkerIds: body.preferredWorkerIds }),
                ...(body.requiresBSP !== undefined && { requiresBSP: body.requiresBSP }),
                ...(body.bspRequires2to1 !== undefined && { bspRequires2to1: body.bspRequires2to1 }),
                ...(body.bspRequiredGender !== undefined && { bspRequiredGender: body.bspRequiredGender }),
                ...(body.bspRequiresPBS !== undefined && { bspRequiresPBS: body.bspRequiresPBS }),
                ...(body.requiresTransfers !== undefined && { requiresTransfers: body.requiresTransfers }),
                ...(body.riskLevel !== undefined && { riskLevel: body.riskLevel })
            }
        })

        return successResponse({
            requirements: {
                id: updated.id,
                requiresHighIntensity: updated.requiresHighIntensity,
                highIntensityTypes: updated.highIntensityTypes,
                genderPreference: updated.genderPreference,
                bannedWorkerIds: updated.bannedWorkerIds,
                preferredWorkerIds: updated.preferredWorkerIds,
                requiresBSP: updated.requiresBSP,
                bspRequires2to1: updated.bspRequires2to1,
                bspRequiredGender: updated.bspRequiredGender,
                bspRequiresPBS: updated.bspRequiresPBS,
                requiresTransfers: updated.requiresTransfers,
                riskLevel: updated.riskLevel,
                createdAt: updated.createdAt.toISOString(),
                updatedAt: updated.updatedAt.toISOString()
            }
        })
    } catch (err) {
        console.error('Error updating client requirements:', err)
        return errorResponse('Failed to update requirements', 'INTERNAL_ERROR', 500)
    }
}

/**
 * DELETE /api/v1/rostering/clients/[id]/requirements
 * Delete requirements for a client
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const clientId = params.id

        // Verify client belongs to organization and has requirements
        const client = await prisma.client.findFirst({
            where: {
                id: clientId,
                organisationId: context!.organisationId
            },
            include: {
                requirements: true
            }
        })

        if (!client) {
            return errorResponse('Client not found', 'NOT_FOUND', 404)
        }

        if (!client.requirements) {
            return errorResponse('No requirements found for this client', 'NOT_FOUND', 404)
        }

        // Delete requirements
        await prisma.clientRequirement.delete({
            where: { id: client.requirements.id }
        })

        return successResponse({ message: 'Requirements deleted successfully' })
    } catch (err) {
        console.error('Error deleting client requirements:', err)
        return errorResponse('Failed to delete requirements', 'INTERNAL_ERROR', 500)
    }
}
