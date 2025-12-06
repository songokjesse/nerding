import { NDISConfigForm } from '@/components/dashboard/clients/ndis-config-form'
import { getNDISConfig } from '../ndis-actions'
import { getClient } from '../../actions'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { OrgRole } from '@/generated/prisma/client/enums'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function NDISConfigPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Fetch client
    const clientResult = await getClient(id)
    if (clientResult.error || !clientResult.client) {
        notFound()
    }

    // Fetch NDIS config
    const { config, error } = await getNDISConfig(id)

    // Check permissions
    const session = await auth.api.getSession({ headers: await headers() })
    const membership = await prisma.organisationMember.findFirst({
        where: { userId: session?.user?.id }
    })

    const canEdit = membership && ([OrgRole.ORG_ADMIN, OrgRole.COORDINATOR] as OrgRole[]).includes(membership.role)

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href={`/dashboard/clients/${id}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Client
                    </Button>
                </Link>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">NDIS Configuration</h1>
                <p className="text-muted-foreground mt-2">
                    Configure NDIS funding, support ratios, and SIL preferences for {clientResult.client.name}
                </p>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
                    <p className="text-sm font-medium">Error loading NDIS configuration</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <NDISConfigForm
                clientId={id}
                initialData={config}
                readOnly={!canEdit}
            />

            {!canEdit && (
                <div className="mt-6 bg-muted px-4 py-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        You don't have permission to edit this configuration. Contact an administrator or coordinator.
                    </p>
                </div>
            )}
        </div>
    )
}
