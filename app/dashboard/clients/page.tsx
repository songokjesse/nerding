import { getClients } from './actions'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { OrgRole } from '@/generated/prisma/client/enums'
import { ClientListView } from '@/components/dashboard/client-list-view'

export default async function ClientsPage() {
    const { clients, error } = await getClients()

    // Check permissions for "Add Client" button
    const session = await auth.api.getSession({ headers: await headers() })
    const membership = await prisma.organisationMember.findFirst({
        where: { userId: session?.user?.id }
    })
    const canCreate = membership && (membership.role === OrgRole.ORG_ADMIN || membership.role === OrgRole.COORDINATOR)

    if (error) {
        return <div className="p-4 text-red-500">Error: {error}</div>
    }

    return (
        <div className="p-6">
            <ClientListView clients={clients || []} canCreate={!!canCreate} />
        </div>
    )
}
