"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, LayoutGrid, List as ListIcon, MapPin, Calendar, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShiftCard } from "@/components/dashboard/shift-card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ShiftStatus } from "@/generated/prisma/client/enums"

interface Shift {
    id: string
    startTime: Date
    endTime: Date
    status: ShiftStatus
    serviceType?: string | null
    location?: string | null
    client: { name: string }
    worker: { name: string }
    progressNotes: { id: string }[]
}

interface MyShiftsListViewProps {
    shifts: Shift[]
}

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

export function MyShiftsListView({ shifts }: MyShiftsListViewProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const [searchQuery, setSearchQuery] = useState("")

    const filteredShifts = shifts.filter((shift) => {
        const query = searchQuery.toLowerCase()
        return (
            shift.client.name.toLowerCase().includes(query) ||
            (shift.location && shift.location.toLowerCase().includes(query))
        )
    })

    const now = new Date()
    const upcomingShifts = filteredShifts.filter(s => new Date(s.startTime) >= now)
    const pastShifts = filteredShifts.filter(s => new Date(s.startTime) < now)

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">My Shifts</h1>
                    <p className="text-muted-foreground mt-1">
                        View your assigned shifts and submit progress notes
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by client or location..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center rounded-md border bg-background p-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 px-2 ${viewMode === "grid" ? "bg-muted" : ""}`}
                        onClick={() => setViewMode("grid")}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 px-2 ${viewMode === "list" ? "bg-muted" : ""}`}
                        onClick={() => setViewMode("list")}
                    >
                        <ListIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Upcoming Shifts */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Upcoming Shifts</h2>
                {upcomingShifts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>No upcoming shifts found</p>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {upcomingShifts.map((shift) => (
                            <ShiftCard key={shift.id} shift={shift} />
                        ))}
                    </div>
                ) : (
                    <ShiftTable shifts={upcomingShifts} />
                )}
            </div>

            {/* Past Shifts */}
            {(pastShifts.length > 0 || (shifts.length > 0 && filteredShifts.length === 0)) && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Past Shifts</h2>
                    {pastShifts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                            <p>No past shifts found</p>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pastShifts.map((shift) => (
                                <div key={shift.id} className="relative">
                                    <ShiftCard shift={shift} />
                                    {shift.progressNotes.length === 0 && (
                                        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded z-10">
                                            No note
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <ShiftTable shifts={pastShifts} showNoteStatus />
                    )}
                </div>
            )}
        </div>
    )
}

function ShiftTable({ shifts, showNoteStatus }: { shifts: Shift[], showNoteStatus?: boolean }) {
    return (
        <div className="rounded-md border bg-white dark:bg-gray-900">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {shifts.map((shift) => {
                        const startDate = new Date(shift.startTime)
                        const endDate = new Date(shift.endTime)
                        return (
                            <TableRow key={shift.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        {startDate.toLocaleDateString()}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{shift.client.name}</TableCell>
                                <TableCell>
                                    {shift.location ? (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            {shift.location}
                                        </div>
                                    ) : "-"}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[shift.status]}`}>
                                            {statusLabels[shift.status]}
                                        </span>
                                        {showNoteStatus && shift.progressNotes.length === 0 && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-500 text-white">
                                                No note
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href={`/dashboard/shifts/${shift.id}`}>View</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
