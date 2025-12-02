import { ClientForm } from '@/components/dashboard/client-form'
import { ClientNotes } from '@/components/dashboard/client-notes'
import { ClientModuleConfig } from '@/components/dashboard/client-modules-config'
import { getClient } from '../actions'
import { getClientModules } from '../modules'
import { getClientNotes } from '@/app/dashboard/notes/actions'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { OrgRole } from '@/generated/prisma/client/enums'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Fetch client, notes, and modules in parallel
    const [clientResult, notesResult, modulesResult] = await Promise.all([
        getClient(id),
        getClientNotes(id),
        getClientModules(id)
    ])

    if (clientResult.error || !clientResult.client) {
        notFound()
    }

    const session = await auth.api.getSession({ headers: await headers() })
    const membership = await prisma.organisationMember.findFirst({
        where: { userId: session?.user?.id }
    })

    const canEdit = membership && ([OrgRole.ORG_ADMIN, OrgRole.COORDINATOR] as OrgRole[]).includes(membership.role)
    const notes = notesResult.notes || []
    const modules = modulesResult.modules || []

    return (
        <div className="p-6">
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left Column - Client Form & Modules */}
                <div className="space-y-6">
                    <ClientForm client={clientResult.client} readOnly={!canEdit} />

                    {/* Rostering Requirements Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="h-5 w-5" />
                                        Rostering Requirements
                                    </CardTitle>
                                    <CardDescription>
                                        Configure support needs and compliance requirements
                                    </CardDescription>
                                </div>
                                <Link href={`/dashboard/rostering/clients/${id}/requirements`}>
                                    <Button variant="outline" size="sm">
                                        Configure
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Set high-intensity support types, gender preferences, BSP requirements, and risk levels for NDIS-compliant rostering.
                            </p>
                        </CardContent>
                    </Card>

                    <ClientModuleConfig
                        clientId={clientResult.client.id}
                        modules={modules}
                        canEdit={!!canEdit}
                    />
                </div>

                {/* Right Column - Progress Notes */}
                <div>
                    <ClientNotes notes={notes} clientName={clientResult.client.name} />
                </div>
            </div>
        </div>
    )
}
