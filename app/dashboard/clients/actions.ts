'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { OrgRole } from '@/generated/prisma/client/enums'

// Schema for client validation
const clientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    ndisNumber: z.string().optional(),
    dateOfBirth: z.string().optional().nullable(), // Expecting ISO string or null
    notes: z.string().optional()
})

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

export async function getClients() {
    try {
        const { membership } = await getOrgMembership()

        const clients = await prisma.client.createManyAndReturn ?
            // Fallback if createManyAndReturn is not what we want, actually we just want findMany
            prisma.client.findMany({
                where: { organisationId: membership.organisationId },
                orderBy: { name: 'asc' }
            }) :
            prisma.client.findMany({
                where: { organisationId: membership.organisationId },
                orderBy: { name: 'asc' }
            })

        return { clients }
    } catch (error) {
        console.error('Failed to fetch clients:', error)
        return { error: 'Failed to fetch clients' }
    }
}

export async function getClient(id: string) {
    try {
        const { membership } = await getOrgMembership()

        const client = await prisma.client.findFirst({
            where: {
                id,
                organisationId: membership.organisationId
            }
        })

        if (!client) {
            return { error: 'Client not found' }
        }

        return { client }
    } catch (error) {
        console.error('Failed to fetch client:', error)
        return { error: 'Failed to fetch client' }
    }
}

export async function createClient(prevState: any, formData: FormData) {
    try {
        const { membership, session } = await getOrgMembership()

        // Role check
        if (![OrgRole.ORG_ADMIN, OrgRole.COORDINATOR].includes(membership.role)) {
            return { error: 'Insufficient permissions' }
        }

        const rawData = {
            name: formData.get('name'),
            ndisNumber: formData.get('ndisNumber'),
            dateOfBirth: formData.get('dateOfBirth') || null,
            notes: formData.get('notes')
        }

        const validated = clientSchema.safeParse(rawData)

        if (!validated.success) {
            return { error: validated.error.flatten().fieldErrors.name?.[0] || 'Invalid input' }
        }

        const { name, ndisNumber, dateOfBirth, notes } = validated.data

        await prisma.client.create({
            data: {
                organisationId: membership.organisationId,
                name,
                ndisNumber: ndisNumber || null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                notes: notes || null,
                createdById: session.user.id
            }
        })

        revalidatePath('/dashboard/clients')
        redirect('/dashboard/clients')

    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        console.error('Failed to create client:', error)
        return { error: 'Failed to create client' }
    }
}

export async function updateClient(id: string, prevState: any, formData: FormData) {
    try {
        const { membership } = await getOrgMembership()

        // Role check
        if (![OrgRole.ORG_ADMIN, OrgRole.COORDINATOR].includes(membership.role)) {
            return { error: 'Insufficient permissions' }
        }

        const rawData = {
            name: formData.get('name'),
            ndisNumber: formData.get('ndisNumber'),
            dateOfBirth: formData.get('dateOfBirth') || null,
            notes: formData.get('notes')
        }

        const validated = clientSchema.safeParse(rawData)

        if (!validated.success) {
            return { error: validated.error.flatten().fieldErrors.name?.[0] || 'Invalid input' }
        }

        const { name, ndisNumber, dateOfBirth, notes } = validated.data

        // Verify ownership before update
        const existingClient = await prisma.client.findFirst({
            where: { id, organisationId: membership.organisationId }
        })

        if (!existingClient) {
            return { error: 'Client not found' }
        }

        await prisma.client.update({
            where: { id },
            data: {
                name,
                ndisNumber: ndisNumber || null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                notes: notes || null
            }
        })

        revalidatePath('/dashboard/clients')
        revalidatePath(`/dashboard/clients/${id}`)
        redirect('/dashboard/clients')

    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        console.error('Failed to update client:', error)
        return { error: 'Failed to update client' }
    }
}
