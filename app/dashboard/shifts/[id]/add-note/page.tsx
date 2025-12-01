import { getShift } from '../../actions'
import { ProgressNoteForm } from '@/components/dashboard/progress-note-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, User, ArrowLeft } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function AddNotePage({ params }: { params: { id: string } }) {
    const session = await auth.api.getSession({ headers: await headers() })
    const { shift, isAssignedWorker, error } = await getShift(params.id)

    if (error || !shift) {
        notFound()
    }

    // Only assigned worker can access this page
    if (!isAssignedWorker) {
        redirect(`/dashboard/shifts/${params.id}`)
    }

    const startDate = new Date(shift.startTime)
    const endDate = new Date(shift.endTime)

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Back Link */}
            <Link
                href={`/dashboard/shifts/${shift.id}`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to shift details
            </Link>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Add Progress Note</h1>
                <p className="text-muted-foreground mt-1">
                    Document your observations and activities for this shift
                </p>
            </div>

            {/* Shift Summary Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Shift Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Client/Site</p>
                            <p className="font-medium">{shift.client?.name || shift.site?.name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Date</p>
                            <p className="font-medium">{startDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Time</p>
                            <p className="font-medium">
                                {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' - '}
                                {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    {shift.serviceType && (
                        <div>
                            <p className="text-sm text-muted-foreground">Service Type</p>
                            <p className="font-medium">{shift.serviceType}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Progress Note Form */}
            <ProgressNoteForm
                shiftId={shift.id}
                clients={shift.site?.clients || []}
                defaultClientId={shift.clientId}
            />
        </div>
    )
}
