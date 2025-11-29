import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock } from 'lucide-react'

interface Shift {
    id: string
    startTime: Date
    endTime: Date
    client: { name: string } | null
    worker: { name: string }
}

interface UpcomingShiftsProps {
    shifts: Shift[]
}

export function UpcomingShifts({ shifts }: UpcomingShiftsProps) {
    if (shifts.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Shifts</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No upcoming shifts</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upcoming Shifts</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {shifts.map((shift) => (
                        <div
                            key={shift.id}
                            className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="font-medium text-sm">{shift.client?.name || 'SIL Shift'}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Worker: {shift.worker.name}
                                    </p>
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(shift.startTime).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(shift.startTime).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
