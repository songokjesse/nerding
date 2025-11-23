import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface Client {
    id: string
    name: string
    ndisNumber: string | null
    createdAt: Date
}

interface RecentClientsProps {
    clients: Client[]
}

export function RecentClients({ clients }: RecentClientsProps) {
    if (clients.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Clients</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No clients yet</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Clients</CardTitle>
                <Link
                    href="/dashboard/clients"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                    View all
                    <ArrowRight className="h-3 w-3" />
                </Link>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {clients.map((client) => (
                        <Link
                            key={client.id}
                            href={`/dashboard/clients/${client.id}`}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                            <div>
                                <p className="font-medium text-sm">{client.name}</p>
                                {client.ndisNumber && (
                                    <p className="text-xs text-muted-foreground">
                                        NDIS: {client.ndisNumber}
                                    </p>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {new Date(client.createdAt).toLocaleDateString()}
                            </span>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
