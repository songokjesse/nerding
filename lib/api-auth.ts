import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export interface AuthContext {
    userId: string
    organisationId: string
    role: string
}

/**
 * Middleware to authenticate API requests and extract user context
 */
export async function authenticateRequest(request: NextRequest): Promise<{ context: AuthContext | null, error: NextResponse | null }> {
    try {
        // Get authorization header
        const authHeader = request.headers.get('authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                context: null,
                error: NextResponse.json(
                    { error: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' },
                    { status: 401 }
                )
            }
        }

        // Extract token
        const token = authHeader.substring(7)

        // Verify session using Better Auth
        const session = await auth.api.getSession({
            headers: {
                authorization: `Bearer ${token}`
            }
        })

        if (!session?.user) {
            return {
                context: null,
                error: NextResponse.json(
                    { error: 'Invalid or expired session', code: 'UNAUTHORIZED' },
                    { status: 401 }
                )
            }
        }

        // Get user's organization membership
        const membership = await prisma.organisationMember.findFirst({
            where: { userId: session.user.id },
            include: { organisation: true }
        })

        if (!membership) {
            return {
                context: null,
                error: NextResponse.json(
                    { error: 'No organization membership found', code: 'FORBIDDEN' },
                    { status: 403 }
                )
            }
        }

        // Return auth context
        return {
            context: {
                userId: session.user.id,
                organisationId: membership.organisationId,
                role: membership.role
            },
            error: null
        }

    } catch (error) {
        console.error('Authentication error:', error)
        return {
            context: null,
            error: NextResponse.json(
                { error: 'Authentication failed', code: 'INTERNAL_ERROR' },
                { status: 500 }
            )
        }
    }
}

/**
 * Helper to create error responses
 */
export function errorResponse(message: string, code: string, status: number = 400) {
    return NextResponse.json({ error: message, code }, { status })
}

/**
 * Helper to create success responses
 */
export function successResponse(data: any, status: number = 200) {
    return NextResponse.json(data, { status })
}
