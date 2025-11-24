import { getShift, saveObservation } from '../actions'
import { getClientModules } from '@/app/dashboard/clients/modules'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, User, FileText, Plus, Activity } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ModuleType } from '@/generated/prisma/client/enums'
import { ShiftObservationSection } from '@/components/dashboard/shift-observation-section'

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

export default async function ShiftDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { shift, isAssignedWorker, error } = await getShift(id)

    if (error || !shift) {
        notFound()
    }

    const { modules } = await getClientModules(shift.clientId)
    const bowelMonitoringEnabled = modules?.some(m => m.moduleType === ModuleType.BOWEL_MONITORING && m.isEnabled)
    const fluidIntakeEnabled = modules?.some(m => m.moduleType === ModuleType.FLUID_INTAKE && m.isEnabled)
    const seizureMonitoringEnabled = modules?.some(m => m.moduleType === ModuleType.SEIZURE_MONITORING && m.isEnabled)
    const behaviourObservationEnabled = modules?.some(m => m.moduleType === ModuleType.BEHAVIOUR_OBSERVATION && m.isEnabled)

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

                    {/* Clinical Observations Section */}
                    {isAssignedWorker && (
                        <ShiftObservationSection
                            shiftId={shift.id}
                            bowelMonitoringEnabled={!!bowelMonitoringEnabled}
                            fluidIntakeEnabled={!!fluidIntakeEnabled}
                            seizureMonitoringEnabled={!!seizureMonitoringEnabled}
                            behaviourObservationEnabled={!!behaviourObservationEnabled}
                        />
                    )}

                    {/* Progress Notes Section */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Progress Notes ({shift.progressNotes.length})</CardTitle>
                            {isAssignedWorker && (
                                <Link href={`/dashboard/shifts/${shift.id}/add-note`}>
                                    <Button size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Note
                                    </Button>
                                </Link>
                            )}
                        </CardHeader>
                        <CardContent>
                            {shift.progressNotes.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-muted-foreground mb-4">
                                        No progress notes yet
                                    </p>
                                    {isAssignedWorker && (
                                        <Link href={`/dashboard/shifts/${shift.id}/add-note`}>
                                            <Button variant="outline">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add First Note
                                            </Button>
                                        </Link>
                                    )}
                                </div>
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

                                            {/* Display Observations */}
                                            {/* @ts-ignore - observations might not be typed yet in prisma client if not fully regenerated/picked up */}
                                            {note.observations && note.observations.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {/* @ts-ignore */}
                                                    {note.observations.map((obs) => (
                                                        <div key={obs.id} className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md border border-purple-100 dark:border-purple-900">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Activity className="h-4 w-4 text-purple-600" />
                                                                <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                                                                    {obs.type === ModuleType.BOWEL_MONITORING ? 'Bowel Observation' : obs.type}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm text-purple-800 dark:text-purple-200 grid grid-cols-2 gap-2">
                                                                {obs.data.type && <p>Type: {obs.data.type}</p>}
                                                                {obs.data.consistency && <p>Consistency: {obs.data.consistency}</p>}
                                                                {obs.data.color && <p>Color: {obs.data.color}</p>}
                                                                {obs.data.concerns && <p className="col-span-2">Concerns: {obs.data.concerns}</p>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

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

                {/* Right Column - Client Info */}
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
                </div>
            </div>
        </div>
    )
}
