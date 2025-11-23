'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const createOrgSchema = z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters'),
    plan: z.string().default('free')
})

export async function createOrganisation(prevState: any, formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user) {
        return { error: 'Not authenticated' }
    }

    const validatedFields = createOrgSchema.safeParse({
        name: formData.get('name'),
        plan: formData.get('plan') || 'free'
    })

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors.name?.[0] || 'Invalid input'
        }
    }

    const { name, plan } = validatedFields.data

    try {
        // Transaction to create org and member
        await prisma.$transaction(async (tx) => {
            const org = await tx.organisation.create({
                data: {
                    name,
                    plan
                }
            })

            await tx.organisationMember.create({
                data: {
                    organisationId: org.id,
                    userId: session.user.id,
                    role: 'ORG_ADMIN'
                }
            })
        })

    } catch (error) {
        console.error('Failed to create organisation:', error)
        return { error: 'Failed to create organisation. Please try again.' }
    }

    redirect('/dashboard')
}
