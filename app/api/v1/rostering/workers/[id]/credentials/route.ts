import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { CredentialType } from '@/generated/prisma/client/enums'

/**
 * GET /api/v1/rostering/workers/[id]/credentials
 * Get all credentials for a worker
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { id: workerId } = await params

        // Verify worker belongs to organization
        const worker = await prisma.user.findFirst({
            where: {
                id: workerId,
                organisationMemberships: {
                    some: { organisationId: context!.organisationId }
                }
            },
            include: {
                workerCredentials: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!worker) {
            return errorResponse('Worker not found', 'NOT_FOUND', 404)
        }

        const credentials = worker.workerCredentials.map(c => ({
            id: c.id,
            type: c.type,
            issueDate: c.issueDate.toISOString(),
            expiryDate: c.expiryDate?.toISOString() || null,
            documentUrl: c.documentUrl,
            verified: c.verified,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString()
        }))

        return successResponse({ credentials })
    } catch (err) {
        console.error('Error fetching worker credentials:', err)
        return errorResponse('Failed to fetch credentials', 'INTERNAL_ERROR', 500)
    }
}

/**
 * POST /api/v1/rostering/workers/[id]/credentials
 * Add a new credential for a worker
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { id: workerId } = await params
        const body = await request.json()

        // Validate required fields
        if (!body.type || !body.issueDate) {
            return errorResponse(
                'Missing required fields: type and issueDate are required',
                'VALIDATION_ERROR',
                400
            )
        }

        // Validate credential type
        if (!Object.values(CredentialType).includes(body.type)) {
            return errorResponse('Invalid credential type', 'VALIDATION_ERROR', 400)
        }

        // Verify worker belongs to organization
        const worker = await prisma.user.findFirst({
            where: {
                id: workerId,
                organisationMemberships: {
                    some: { organisationId: context!.organisationId }
                }
            }
        })

        if (!worker) {
            return errorResponse('Worker not found', 'NOT_FOUND', 404)
        }

        // Create credential
        const credential = await prisma.workerCredential.create({
            data: {
                workerId,
                type: body.type,
                issueDate: new Date(body.issueDate),
                expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
                documentUrl: body.documentUrl,
                verified: body.verified || false
            }
        })

        return successResponse({
            credential: {
                id: credential.id,
                type: credential.type,
                issueDate: credential.issueDate.toISOString(),
                expiryDate: credential.expiryDate?.toISOString() || null,
                documentUrl: credential.documentUrl,
                verified: credential.verified,
                createdAt: credential.createdAt.toISOString(),
                updatedAt: credential.updatedAt.toISOString()
            }
        }, 201)
    } catch (err) {
        console.error('Error creating worker credential:', err)
        return errorResponse('Failed to create credential', 'INTERNAL_ERROR', 500)
    }
}

/**
 * PUT /api/v1/rostering/workers/[id]/credentials
 * Update a credential (requires credentialId in body)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { id: workerId } = await params
        const body = await request.json()

        if (!body.credentialId) {
            return errorResponse('credentialId is required', 'VALIDATION_ERROR', 400)
        }

        // Verify credential belongs to worker in this organization
        const credential = await prisma.workerCredential.findFirst({
            where: {
                id: body.credentialId,
                workerId,
                worker: {
                    organisationMemberships: {
                        some: { organisationId: context!.organisationId }
                    }
                }
            }
        })

        if (!credential) {
            return errorResponse('Credential not found', 'NOT_FOUND', 404)
        }

        // Update credential
        const updated = await prisma.workerCredential.update({
            where: { id: body.credentialId },
            data: {
                ...(body.issueDate && { issueDate: new Date(body.issueDate) }),
                ...(body.expiryDate !== undefined && {
                    expiryDate: body.expiryDate ? new Date(body.expiryDate) : null
                }),
                ...(body.documentUrl !== undefined && { documentUrl: body.documentUrl }),
                ...(body.verified !== undefined && { verified: body.verified })
            }
        })

        return successResponse({
            credential: {
                id: updated.id,
                type: updated.type,
                issueDate: updated.issueDate.toISOString(),
                expiryDate: updated.expiryDate?.toISOString() || null,
                documentUrl: updated.documentUrl,
                verified: updated.verified,
                createdAt: updated.createdAt.toISOString(),
                updatedAt: updated.updatedAt.toISOString()
            }
        })
    } catch (err) {
        console.error('Error updating worker credential:', err)
        return errorResponse('Failed to update credential', 'INTERNAL_ERROR', 500)
    }
}

/**
 * DELETE /api/v1/rostering/workers/[id]/credentials
 * Delete a credential (requires credentialId in query)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { id: workerId } = await params
        const { searchParams } = new URL(request.url)
        const credentialId = searchParams.get('credentialId')

        if (!credentialId) {
            return errorResponse('credentialId query parameter is required', 'VALIDATION_ERROR', 400)
        }

        // Verify credential belongs to worker in this organization
        const credential = await prisma.workerCredential.findFirst({
            where: {
                id: credentialId,
                workerId,
                worker: {
                    organisationMemberships: {
                        some: { organisationId: context!.organisationId }
                    }
                }
            }
        })

        if (!credential) {
            return errorResponse('Credential not found', 'NOT_FOUND', 404)
        }

        // Delete credential
        await prisma.workerCredential.delete({
            where: { id: credentialId }
        })

        return successResponse({ message: 'Credential deleted successfully' })
    } catch (err) {
        console.error('Error deleting worker credential:', err)
        return errorResponse('Failed to delete credential', 'INTERNAL_ERROR', 500)
    }
}
