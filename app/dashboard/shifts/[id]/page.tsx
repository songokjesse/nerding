import { getShift } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, MapPin, User, FileText } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProgressNoteForm } from '@/components/dashboard/progress-note-form'

const statusColors = {
    PLANNED: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-orange-100 text-orange-700'
}

const statusLabels = {
    PLANNED: 'Planned',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show'
}

export default async function ShiftDetailPage({ params }: { params: { id: string } }) {
    const { shift, isAssignedWorker, error } = await getShift(params.id)

    if (error || !shift) {
        notFound()
    }

    const startDate = new Date(shift.startTime)
    const endDate = new Date(shift.endTime)

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{shift.client.name}</h1>
                    <p className="text-muted-foreground mt-1">
                        Shift Details
                    </p>
                </div>
                <span className={`text-sm px-3 py-1 rounded-full ${statusColors[shift.status]}`}>
                    {statusLabels[shift.status]}
                </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Shift Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Shift Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Shift Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Assigned Worker</p>
                                    <p className="font-medium">{shift.worker.name}</p>
                                    <p className="text-sm text-muted-foreground">{shift.worker.email}</p>
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

                            {shift.location && (
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Location</p>
                                        <p className="font-medium">{shift.location}</p>
                                    </div>
                                </div>
                            )}

                            {shift.serviceType && (
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Service Type</p>
                                        <p className="font-medium">{shift.serviceType}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Progress Notes Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Progress Notes ({shift.progressNotes.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {shift.progressNotes.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No progress notes yet
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {shift.progressNotes.map((note) => (
                                        <div key={note.id} className="border-b pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-medium">{note.author.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(note.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">{note.noteText}</p>

                                            {note.mood && (
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    Mood: <span className="font-medium">{note.mood}</span>
                                                </p>
                                            )}

                                            {(note.incidentFlag || note.behavioursFlag || note.medicationFlag) && (
                                                <div className="flex gap-2 mt-2">
                                                    {note.incidentFlag && (
                                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                                            Incident
                                                        </span>
                                                    )}
                                                    {note.behavioursFlag && (
                                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                                            Behaviour
                                                        </span>
                                                    )}
                                                    {note.medicationFlag && (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                            Medication
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Client Info & Note Form */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Client Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Name</p>
                                <p className="font-medium">{shift.client.name}</p>
                            </div>
                            {shift.client.ndisNumber && (
                                <div>
                                    <p className="text-sm text-muted-foreground">NDIS Number</p>
                                    <p className="font-medium">{shift.client.ndisNumber}</p>
                                </div>
                            )}
                            {shift.client.dateOfBirth && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                                    <p className="font-medium">
                                        {new Date(shift.client.dateOfBirth).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                            <Link
                                href={`/dashboard/clients/${shift.client.id}`}
                                className="text-sm text-primary hover:underline inline-block mt-2"
                            >
                                View full client profile →
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Progress Note Form - Only for assigned worker */}
                    {isAssignedWorker && (
                        <ProgressNoteForm shiftId={shift.id} />
                    )}
                </div>
            </div>
        </div>
    )
}
