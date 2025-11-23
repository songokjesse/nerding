'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { OrgRole } from '@/generated/prisma/client/enums'

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

export async function getMembers() {
    try {
        const { membership } = await getOrgMembership()

        const members = await prisma.organisationMember.findMany({
            where: { organisationId: membership.organisationId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return { members }
    } catch (error) {
        console.error('Failed to fetch members:', error)
        return { error: 'Failed to fetch members' }
    }
}

export async function updateMemberRole(memberId: string, newRole: OrgRole) {
    try {
        const { membership } = await getOrgMembership()

        // Only ORG_ADMIN can update roles
        if (membership.role !== OrgRole.ORG_ADMIN) {
            return { error: 'Insufficient permissions' }
        }

        // Verify the target member is in the same org
        const targetMember = await prisma.organisationMember.findFirst({
            where: {
                id: memberId,
                organisationId: membership.organisationId
            }
        })

        if (!targetMember) {
            return { error: 'Member not found' }
        }

        // Prevent removing the last admin (optional safety check, but good practice)
        // For now, we'll just allow it but maybe warn in UI. 
        // Actually, let's prevent self-demotion if you are the only admin? 
        // Keeping it simple for now as per requirements.

        await prisma.organisationMember.update({
            where: { id: memberId },
            data: { role: newRole }
        })

        revalidatePath('/dashboard/members')
        return { success: true }

    } catch (error) {
        console.error('Failed to update member role:', error)
        return { error: 'Failed to update member role' }
    }
}

export async function removeMember(memberId: string) {
    try {
        const { membership } = await getOrgMembership()

        // Only ORG_ADMIN can remove members
        if (membership.role !== OrgRole.ORG_ADMIN) {
            return { error: 'Insufficient permissions' }
        }

        // Verify the target member is in the same org
        const targetMember = await prisma.organisationMember.findFirst({
            where: {
                id: memberId,
                organisationId: membership.organisationId
            }
        })

        if (!targetMember) {
            return { error: 'Member not found' }
        }

        // Prevent self-removal? usually yes, but maybe they want to leave.
        // Let's allow it for now, or maybe UI handles "Leave Org" differently.
        // If removing SOMEONE ELSE, it's fine.

        await prisma.organisationMember.delete({
            where: { id: memberId }
        })

        revalidatePath('/dashboard/members')
        return { success: true }

    } catch (error) {
        console.error('Failed to remove member:', error)
        return { error: 'Failed to remove member' }
    }
}
