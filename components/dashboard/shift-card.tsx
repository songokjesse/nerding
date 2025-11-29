import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, MapPin, User } from 'lucide-react'
import Link from 'next/link'
import { ShiftStatus } from '@/generated/prisma/client/enums'

interface ShiftCardProps {
    shift: {
        id: string
        startTime: Date
        endTime: Date
        status: ShiftStatus
        serviceType?: string | null
        location?: string | null
        client: { name: string } | null
        worker: { name: string }
    }
}

const statusColors = {
    PLANNED: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    IN_PROGRESS: 'bg-purple-100 text-purple-700',
    CANCELLED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-orange-100 text-orange-700'
}

const statusLabels = {
    PLANNED: 'Planned',
    COMPLETED: 'Completed',
    IN_PROGRESS: 'In Progress',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show'
}

export function ShiftCard({ shift }: ShiftCardProps) {
    const startDate = new Date(shift.startTime)
    const endDate = new Date(shift.endTime)
    const isPast = startDate < new Date()

    return (
        <Link href={`/dashboard/shifts/${shift.id}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{shift.client?.name || 'SIL Shift'}</CardTitle>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[shift.status]}`}>
                            {statusLabels[shift.status]}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{shift.worker.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{startDate.toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {shift.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{shift.location}</span>
                        </div>
                    )}

                    {shift.serviceType && (
                        <div className="text-sm font-medium mt-2">
                            {shift.serviceType}
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    )
}
