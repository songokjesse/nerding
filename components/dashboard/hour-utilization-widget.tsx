'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface ClientHoursSummary {
    clientId: string
    clientName: string
    allocatedHours: number
    usedHours: number
    remainingHours: number
    percentageUsed: number
    planEndDate: string | null
    isApproachingLimit: boolean
    isExceeded: boolean
}

interface HourUtilizationWidgetProps {
    clients: ClientHoursSummary[]
}

export function HourUtilizationWidget({ clients }: HourUtilizationWidgetProps) {
    if (clients.length === 0) {
        return null
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            NDIS Hour Utilization
                        </CardTitle>
                        <CardDescription>
                            Clients approaching their NDIS hour limits
                        </CardDescription>
                    </div>
                    <Link href="/dashboard/rostering">
                        <Button variant="ghost" size="sm">
                            View All
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {clients.map((client) => {
                    const getStatusColor = () => {
                        if (client.isExceeded) return 'bg-red-600'
                        if (client.percentageUsed >= 90) return 'bg-red-600'
                        if (client.percentageUsed >= 70) return 'bg-yellow-600'
                        return 'bg-green-600'
                    }

                    const getStatusBadge = () => {
                        if (client.isExceeded) {
                            return (
                                <Badge variant="destructive" className="gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Exceeded
                                </Badge>
                            )
                        }
                        if (client.percentageUsed >= 90) {
                            return (
                                <Badge variant="destructive" className="gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Critical
                                </Badge>
                            )
                        }
                        if (client.percentageUsed >= 70) {
                            return (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Warning
                                </Badge>
                            )
                        }
                        return null
                    }

                    const daysRemaining = client.planEndDate
                        ? Math.ceil(
                            (new Date(client.planEndDate).getTime() - new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                        : null

                    return (
                        <Link
                            key={client.clientId}
                            href={`/dashboard/clients/${client.clientId}/ndis-config`}
                            className="block group"
                        >
                            <div className="rounded-lg border p-4 hover:bg-accent transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h4 className="font-medium group-hover:text-primary transition-colors">
                                            {client.clientName}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {client.usedHours.toFixed(1)} / {client.allocatedHours} hours
                                        </p>
                                    </div>
                                    {getStatusBadge()}
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-secondary rounded-full h-2 mb-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${getStatusColor()}`}
                                        style={{ width: `${Math.min(client.percentageUsed, 100)}%` }}
                                    ></div>
                                </div>

                                {/* Details */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{client.percentageUsed}% utilized</span>
                                    <span>
                                        {client.remainingHours.toFixed(1)} hours remaining
                                        {daysRemaining !== null && daysRemaining > 0 && (
                                            <> • {daysRemaining} days left</>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    )
                })}

                {clients.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No clients approaching hour limits</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
