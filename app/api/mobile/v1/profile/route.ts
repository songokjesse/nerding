import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    // Authenticate request
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: context!.userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true
            }
        })

        if (!user) {
            return errorResponse('User not found', 'NOT_FOUND', 404)
        }

        // Get organization membership
        const membership = await prisma.organisationMember.findFirst({
            where: {
                userId: context!.userId,
                organisationId: context!.organisationId
            },
            include: {
                organisation: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        if (!membership) {
            return errorResponse('Organization membership not found', 'NOT_FOUND', 404)
        }

        return successResponse({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image
            },
            organisation: {
                id: membership.organisation.id,
                name: membership.organisation.name,
                role: membership.role
            }
        })

    } catch (err) {
        console.error('Error fetching profile:', err)
        return errorResponse('Failed to fetch profile', 'INTERNAL_ERROR', 500)
    }
}
