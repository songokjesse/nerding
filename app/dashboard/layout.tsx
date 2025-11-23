import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user) {
        redirect('/sign-in')
    }

    // Check if user has any organisation memberships
    const membership = await prisma.organisationMember.findFirst({
        where: {
            userId: session.user.id
        }
    })

    if (!membership) {
        redirect('/onboarding')
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* We can add a dashboard sidebar/header here later */}
            {children}
        </div>
    )
}
