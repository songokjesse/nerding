import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { OrgRole } from '@/generated/prisma/client/enums'

export async function GET(request: NextRequest) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const role = searchParams.get('role') as OrgRole | null

    if (query.length < 2) {
        return NextResponse.json({ users: [] })
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                organisationMemberships: {
                    some: {
                        organisationId: context!.organisationId,
                        ...(role && { role })
                    }
                },
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true
            },
            take: 10
        })

        return NextResponse.json({ users })
    } catch (err) {
        console.error('User search error:', err)
        return NextResponse.json(
            { error: 'Failed to search users' },
            { status: 500 }
        )
    }
}
