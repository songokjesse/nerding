import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids') || ''
    const ids = idsParam.split(',').filter(Boolean)

    if (ids.length === 0) {
        return NextResponse.json({ users: [] })
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                id: { in: ids },
                organisationMemberships: {
                    some: { organisationId: context!.organisationId }
                }
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        })

        return NextResponse.json({ users })
    } catch (err) {
        console.error('Batch user fetch error:', err)
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        )
    }
}
