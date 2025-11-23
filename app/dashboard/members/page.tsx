import { getMembers } from './actions'
import { MemberTable } from '@/components/dashboard/member-table'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'

export default async function MembersPage() {
    const { members, error } = await getMembers()

    const session = await auth.api.getSession({ headers: await headers() })
    const membership = await prisma.organisationMember.findFirst({
        where: { userId: session?.user?.id }
    })

    if (error || !members || !membership) {
        return <div className="p-4 text-red-500">Error: {error || 'Failed to load members'}</div>
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Team Members</h1>
                    <p className="text-gray-500">Manage roles and access for your organization.</p>
                </div>
            </div>

            <MemberTable
                members={members}
                currentUserRole={membership.role}
                currentUserId={session!.user.id}
            />
        </div>
    )
}
