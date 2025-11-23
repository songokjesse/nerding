'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// Helper to get current user's org membership
async function getOrgMembership() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user) {
        throw new Error('Not authenticated')
    }

    const membership = await prisma.organisationMember.findFirst({
        where: { userId: session.user.id },
        include: { organisation: true }
    })

    if (!membership) {
        throw new Error('No organisation membership found')
    }

    return { session, membership }
}

export async function getDashboardData() {
    try {
        const { membership } = await getOrgMembership()
        const orgId = membership.organisationId

        // Fetch all data in parallel
        const [
            clientCount,
            memberCount,
            recentClients,
            upcomingShifts,
            recentNotes,
            shiftsThisWeek
        ] = await Promise.all([
            // Total clients
            prisma.client.count({
                where: { organisationId: orgId }
            }),

            // Total members
            prisma.organisationMember.count({
                where: { organisationId: orgId }
            }),

            // Recent clients (last 5)
            prisma.client.findMany({
                where: { organisationId: orgId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    ndisNumber: true,
                    createdAt: true
                }
            }),

            // Upcoming shifts (next 5)
            prisma.shift.findMany({
                where: {
                    organisationId: orgId,
                    startTime: { gte: new Date() },
                    status: 'PLANNED'
                },
                orderBy: { startTime: 'asc' },
                take: 5,
                include: {
                    client: { select: { name: true } },
                    worker: { select: { name: true } }
                }
            }),

            // Recent progress notes (last 5)
            prisma.progressNote.findMany({
                where: { organisationId: orgId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    client: { select: { name: true } },
                    author: { select: { name: true } }
                }
            }),

            // Shifts this week
            prisma.shift.count({
                where: {
                    organisationId: orgId,
                    startTime: {
                        gte: getStartOfWeek(),
                        lte: getEndOfWeek()
                    }
                }
            })
        ])

        return {
            organisation: membership.organisation,
            stats: {
                clientCount,
                memberCount,
                shiftsThisWeek
            },
            recentClients,
            upcomingShifts,
            recentNotes
        }
    } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        return { error: 'Failed to fetch dashboard data' }
    }
}

// Helper functions for date ranges
function getStartOfWeek() {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = now.getDate() - dayOfWeek
    return new Date(now.setDate(diff))
}

function getEndOfWeek() {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = now.getDate() + (6 - dayOfWeek)
    return new Date(now.setDate(diff))
}
