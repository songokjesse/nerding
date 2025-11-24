'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { ModuleType, OrgRole } from '@/generated/prisma/client/enums'

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

export async function getClientModules(clientId: string) {
    try {
        const { membership } = await getOrgMembership()

        // Verify client belongs to org
        const client = await prisma.client.findFirst({
            where: { id: clientId, organisationId: membership.organisationId }
        })

        if (!client) {
            return { error: 'Client not found' }
        }

        const modules = await prisma.clientModule.findMany({
            where: { clientId }
        })
        console.log('Fetched modules for client:', clientId, modules)

        return { modules }
    } catch (error) {
        console.error('Failed to fetch client modules:', error)
        return { error: 'Failed to fetch client modules' }
    }
}

export async function toggleClientModule(clientId: string, moduleType: ModuleType, isEnabled: boolean) {
    try {
        const { membership } = await getOrgMembership()

        // Role check
        if (membership.role !== OrgRole.ORG_ADMIN && membership.role !== OrgRole.COORDINATOR) {
            return { error: 'Insufficient permissions' }
        }

        // Verify client belongs to org
        const client = await prisma.client.findFirst({
            where: { id: clientId, organisationId: membership.organisationId }
        })

        if (!client) {
            return { error: 'Client not found' }
        }

        await prisma.clientModule.upsert({
            where: {
                clientId_moduleType: {
                    clientId,
                    moduleType
                }
            },
            create: {
                clientId,
                moduleType,
                isEnabled
            },
            update: {
                isEnabled
            }
        })

        revalidatePath(`/dashboard/clients/${clientId}`)
        return { success: true }

    } catch (error) {
        console.error('Failed to toggle module:', error)
        return { error: 'Failed to toggle module' }
    }
}
