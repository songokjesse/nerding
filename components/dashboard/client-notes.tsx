'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, FileText, Download, Filter, X } from 'lucide-react'
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
        id: string
        startTime: Date
        endTime: Date
    }
}

interface ClientNotesProps {
    notes: ProgressNote[]
    clientName: string
}

export function ClientNotes({ notes, clientName }: ClientNotesProps) {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    // Filter notes by date range
    const filteredNotes = useMemo(() => {
        if (!startDate && !endDate) return notes

        return notes.filter(note => {
            const noteDate = new Date(note.shift.startTime)
            const start = startDate ? new Date(startDate) : null
            const end = endDate ? new Date(endDate) : null

            if (start && noteDate < start) return false
            if (end) {
                const endOfDay = new Date(end)
                endOfDay.setHours(23, 59, 59, 999)
                if (noteDate > endOfDay) return false
            }
            return true
        })
    }, [notes, startDate, endDate])

    // Clear filters
    const clearFilters = () => {
        setStartDate('')
        setEndDate('')
    }

    // Export notes as text/CSV
    const exportNotes = () => {
        const csvContent = [
            // Header
            ['Date', 'Time', 'Author', 'Note', 'Mood', 'Flags'].join(','),
            // Data rows
            ...filteredNotes.map(note => {
                const shiftDate = new Date(note.shift.startTime)
                const flags = [
                    note.incidentFlag ? 'Incident' : '',
                    note.behavioursFlag ? 'Behaviour' : '',
                    note.medicationFlag ? 'Medication' : ''
                ].filter(Boolean).join('; ')

                return [
                    shiftDate.toLocaleDateString(),
                    shiftDate.toLocaleTimeString(),
                    note.author.name,
                    `"${note.noteText.replace(/"/g, '""')}"`, // Escape quotes
                    note.mood || '',
                    flags
                ].join(',')
            })
        ].join('\n')

        // Create download
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${clientName.replace(/\s+/g, '_')}_progress_notes_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }

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

    const hasActiveFilters = startDate || endDate

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>
                        Progress Notes ({filteredNotes.length}
                        {hasActiveFilters && ` of ${notes.length}`})
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            {showFilters ? 'Hide' : 'Filter'}
                        </Button>
                        {filteredNotes.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={exportNotes}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter Controls */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">From Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">To Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="w-full"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Clear Filters
                            </Button>
                        )}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {filteredNotes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No notes found for the selected date range</p>
                        <Button
                            variant="link"
                            onClick={clearFilters}
                            className="mt-2"
                        >
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredNotes.map((note) => {
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

                                    {/* Shift Info with Link */}
                                    <Link href={`/dashboard/shifts/${note.shift.id}`}>
                                        <div className="bg-muted/50 hover:bg-muted rounded-lg p-3 mb-3 transition-colors cursor-pointer">
                                            <p className="text-sm font-medium mb-1">Shift Details</p>
                                            <p className="text-sm text-muted-foreground">
                                                {shiftStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {' - '}
                                                {shiftEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <p className="text-xs text-primary mt-1">View shift →</p>
                                        </div>
                                    </Link>

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
                )}
            </CardContent>
        </Card>
    )
}
