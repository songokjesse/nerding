import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Activity, Pill } from 'lucide-react'

interface ProgressNote {
    id: string
    noteText: string
    createdAt: Date
    incidentFlag: boolean
    behavioursFlag: boolean
    medicationFlag: boolean
    client: { name: string }
    author: { name: string }
}

interface RecentActivityProps {
    notes: ProgressNote[]
}

export function RecentActivity({ notes }: RecentActivityProps) {
    if (notes.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {notes.map((note) => (
                        <div
                            key={note.id}
                            className="pb-3 border-b last:border-0 last:pb-0"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="font-medium text-sm">{note.client.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        by {note.author.name}
                                    </p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(note.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {note.noteText}
                            </p>

                            {(note.incidentFlag || note.behavioursFlag || note.medicationFlag) && (
                                <div className="flex gap-2 flex-wrap">
                                    {note.incidentFlag && (
                                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                            <AlertCircle className="h-3 w-3" />
                                            Incident
                                        </span>
                                    )}
                                    {note.behavioursFlag && (
                                        <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                            <Activity className="h-3 w-3" />
                                            Behaviour
                                        </span>
                                    )}
                                    {note.medicationFlag && (
                                        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                            <Pill className="h-3 w-3" />
                                            Medication
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
