import { ClientForm } from '@/components/dashboard/client-form'
import { ClientNotes } from '@/components/dashboard/client-notes'
import { getClient } from '../actions'
import { getClientNotes } from '@/app/dashboard/notes/actions'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { OrgRole } from '@/generated/prisma/client/enums'
import { notFound } from 'next/navigation'

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Fetch client and notes in parallel
    const [clientResult, notesResult] = await Promise.all([
        getClient(id),
        getClientNotes(id)
    ])

    if (clientResult.error || !clientResult.client) {
        notFound()
    }

    const session = await auth.api.getSession({ headers: await headers() })
    const membership = await prisma.organisationMember.findFirst({
        where: { userId: session?.user?.id }
    })

    const canEdit = membership && [OrgRole.ORG_ADMIN, OrgRole.COORDINATOR].includes(membership.role)
    const notes = notesResult.notes || []

    return (
        <div className="p-6">
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left Column - Client Form */}
                <div>
                    <ClientForm client={clientResult.client} readOnly={!canEdit} />
                </div>

                {/* Right Column - Progress Notes */}
                <div>
                    <ClientNotes notes={notes} clientName={clientResult.client.name} />
                </div>
            </div>
        </div>
    )
}
