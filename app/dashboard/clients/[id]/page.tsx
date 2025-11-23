import { ClientForm } from '@/components/dashboard/client-form'
import { getClient } from '../actions'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { OrgRole } from '@/generated/prisma/client/enums'
import { notFound } from 'next/navigation'

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { client, error } = await getClient(id)

    if (error || !client) {
        notFound()
    }

    const session = await auth.api.getSession({ headers: await headers() })
    const membership = await prisma.organisationMember.findFirst({
        where: { userId: session?.user?.id }
    })

    const canEdit = membership && [OrgRole.ORG_ADMIN, OrgRole.COORDINATOR].includes(membership.role)

    return (
        <div className="p-6">
            <ClientForm client={client} readOnly={!canEdit} />
        </div>
    )
}
