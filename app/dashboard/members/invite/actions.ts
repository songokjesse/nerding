'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { OrgRole } from '@/generated/prisma/client/enums'

const inviteSchema = z.object({
    email: z.string().email('Invalid email address'),
    role: z.nativeEnum(OrgRole)
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

export async function inviteMember(prevState: any, formData: FormData) {
    try {
        const { membership } = await getOrgMembership()

        // Only ORG_ADMIN can invite
        if (membership.role !== OrgRole.ORG_ADMIN) {
            return { error: 'Insufficient permissions' }
        }

        const rawData = {
            email: formData.get('email'),
            role: formData.get('role')
        }

        const validated = inviteSchema.safeParse(rawData)

        if (!validated.success) {
            return { error: validated.error.flatten().fieldErrors.email?.[0] || 'Invalid input' }
        }

        const { email, role } = validated.data

        // 1. Check if user exists
        const userToInvite = await prisma.user.findUnique({
            where: { email }
        })

        if (!userToInvite) {
            return { error: 'User not found. Please ask them to sign up first.' }
        }

        // 2. Check if already a member
        const existingMembership = await prisma.organisationMember.findFirst({
            where: {
                userId: userToInvite.id,
                organisationId: membership.organisationId
            }
        })

        if (existingMembership) {
            return { error: 'User is already a member of this organization.' }
        }

        // 3. Create membership
        await prisma.organisationMember.create({
            data: {
                userId: userToInvite.id,
                organisationId: membership.organisationId,
                role: role
            }
        })

        revalidatePath('/dashboard/members')
        redirect('/dashboard/members')

    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        console.error('Failed to invite member:', error)
        return { error: 'Failed to invite member' }
    }
}
