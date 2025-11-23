import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, Calendar } from 'lucide-react'
import Link from 'next/link'

interface QuickAction {
    label: string
    href: string
    icon: React.ReactNode
    description: string
}

export function QuickActions() {
    const actions: QuickAction[] = [
        {
            label: 'Add Client',
            href: '/dashboard/clients/new',
            icon: <Plus className="h-4 w-4" />,
            description: 'Register a new client'
        },
        {
            label: 'View Members',
            href: '/dashboard/members',
            icon: <Users className="h-4 w-4" />,
            description: 'Manage team members'
        },
        {
            label: 'View Clients',
            href: '/dashboard/clients',
            icon: <Calendar className="h-4 w-4" />,
            description: 'See all clients'
        }
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {actions.map((action) => (
                        <Link key={action.href} href={action.href}>
                            <Button
                                variant="outline"
                                className="w-full justify-start h-auto py-3"
                            >
                                <div className="flex items-start gap-3 text-left">
                                    <div className="mt-0.5">{action.icon}</div>
                                    <div>
                                        <div className="font-medium">{action.label}</div>
                                        <div className="text-xs text-muted-foreground font-normal">
                                            {action.description}
                                        </div>
                                    </div>
                                </div>
                            </Button>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
