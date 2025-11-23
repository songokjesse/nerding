'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, FileText } from 'lucide-react'
import Link from 'next/link'

interface ProgressNote {
    id: string
    noteText: string
    incidentFlag: boolean
    behavioursFlag: boolean
    medicationFlag: boolean
    mood: string | null
    createdAt: Date
    author: { name: string }
    shift: {
        startTime: Date
        endTime: Date
    }
}

interface ClientNotesProps {
    notes: ProgressNote[]
    clientName: string
}

export function ClientNotes({ notes, clientName }: ClientNotesProps) {
    if (notes.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Progress Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No progress notes yet</p>
                        <p className="text-sm mt-1">Notes will appear here after shifts are completed</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Progress Notes ({notes.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {notes.map((note) => {
                        const shiftDate = new Date(note.shift.startTime)
                        const shiftStart = new Date(note.shift.startTime)
                        const shiftEnd = new Date(note.shift.endTime)

                        return (
                            <div key={note.id} className="border-b pb-6 last:border-0 last:pb-0">
                                {/* Note Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-medium">{note.author.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(note.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>{shiftDate.toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Shift Info */}
                                <div className="bg-muted/50 rounded-lg p-3 mb-3">
                                    <p className="text-sm font-medium mb-1">Shift Details</p>
                                    <p className="text-sm text-muted-foreground">
                                        {shiftStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {' - '}
                                        {shiftEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                {/* Note Text */}
                                <p className="text-sm whitespace-pre-wrap mb-3">{note.noteText}</p>

                                {/* Mood */}
                                {note.mood && (
                                    <div className="mb-3">
                                        <span className="text-sm text-muted-foreground">Mood: </span>
                                        <span className="text-sm font-medium">{note.mood}</span>
                                    </div>
                                )}

                                {/* Flags */}
                                {(note.incidentFlag || note.behavioursFlag || note.medicationFlag) && (
                                    <div className="flex gap-2">
                                        {note.incidentFlag && (
                                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                                🚨 Incident
                                            </span>
                                        )}
                                        {note.behavioursFlag && (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                                ⚠️ Behaviour
                                            </span>
                                        )}
                                        {note.medicationFlag && (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                💊 Medication
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
