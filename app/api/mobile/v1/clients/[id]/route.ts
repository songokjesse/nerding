import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Authenticate request
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { id } = await params

        // Check if worker has any shifts with this client
        const hasAccess = await prisma.shift.findFirst({
            where: {
                clientId: id,
                organisationId: context!.organisationId,
                workerId: context!.userId
            }
        })

        if (!hasAccess) {
            return errorResponse('Client not found or access denied', 'NOT_FOUND', 404)
        }

        // Get client details
        const client = await prisma.client.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                ndisNumber: true,
                dateOfBirth: true,
                notes: true
            }
        })

        if (!client) {
            return errorResponse('Client not found', 'NOT_FOUND', 404)
        }

        // Get enabled modules
        const modules = await prisma.clientModule.findMany({
            where: {
                clientId: id,
                isEnabled: true
            },
            select: {
                moduleType: true,
                isEnabled: true
            }
        })

        return successResponse({
            client: {
                id: client.id,
                name: client.name,
                ndisNumber: client.ndisNumber,
                dateOfBirth: client.dateOfBirth?.toLocaleString('sv-SE').replace(' ', 'T'),
                notes: client.notes,
                enabledModules: modules
            }
        })

    } catch (err) {
        console.error('Error fetching client:', err)
        return errorResponse('Failed to fetch client', 'INTERNAL_ERROR', 500)
    }
}
