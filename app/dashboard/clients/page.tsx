import { getClients } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { OrgRole } from '@/generated/prisma/client/enums'

export default async function ClientsPage() {
    const { clients, error } = await getClients()

    // Check permissions for "Add Client" button
    const session = await auth.api.getSession({ headers: await headers() })
    const membership = await prisma.organisationMember.findFirst({
        where: { userId: session?.user?.id }
    })
    const canCreate = membership && [OrgRole.ORG_ADMIN, OrgRole.COORDINATOR].includes(membership.role)

    if (error) {
        return <div className="p-4 text-red-500">Error: {error}</div>
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Clients</h1>
                {canCreate && (
                    <Link href="/dashboard/clients/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Client
                        </Button>
                    </Link>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clients?.map((client) => (
                    <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
                        <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                            <CardHeader>
                                <CardTitle>{client.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-gray-500 space-y-1">
                                    {client.ndisNumber && (
                                        <p>NDIS: {client.ndisNumber}</p>
                                    )}
                                    {client.dateOfBirth && (
                                        <p>DOB: {new Date(client.dateOfBirth).toLocaleDateString()}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
                {clients?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No clients found.
                    </div>
                )}
            </div>
        </div>
    )
}
