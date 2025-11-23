'use client'

import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { updateShiftTimes, reassignShiftWorker, getShiftsForDateRange } from '@/app/dashboard/shifts/actions'
import { ShiftStatus } from '@/generated/prisma/client/enums'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { NDIS_SERVICE_TYPES } from '@/lib/constants'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'

const locales = {
    'en-US': require('date-fns/locale/en-US')
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

const DragAndDropCalendar = withDragAndDrop(Calendar as any)

// Worker color palette for visual distinction
const WORKER_COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#6366f1', // indigo
    '#84cc16', // lime
]

interface CalendarShift {
    id: string
    title: string
    start: Date
    end: Date
    resource: {
        shiftId: string
        clientId: string
        clientName: string
        workerId: string
        workerName: string
        status: ShiftStatus
        serviceType?: string | null
        location?: string | null
    }
}

interface CalendarViewProps {
    initialShifts: any[]
    workers: { id: string; name: string; email: string }[]
    canEdit: boolean
}

export function CalendarView({ initialShifts, workers, canEdit }: CalendarViewProps) {
    const router = useRouter()
    const [view, setView] = useState<View>('month')
    const [date, setDate] = useState(new Date())
    const [selectedWorker, setSelectedWorker] = useState<string>('all')
    const [selectedServiceType, setSelectedServiceType] = useState<string>('all')
    const [shifts, setShifts] = useState(initialShifts)
    const [isLoading, setIsLoading] = useState(false)

    // Create a color map for workers
    const workerColorMap = useMemo(() => {
        const map = new Map<string, string>()
        workers.forEach((worker, index) => {
            map.set(worker.id, WORKER_COLORS[index % WORKER_COLORS.length])
        })
        return map
    }, [workers])

    // Fetch shifts when date range changes
    useEffect(() => {
        const fetchShifts = async () => {
            setIsLoading(true)
            const start = startOfMonth(date)
            const end = endOfMonth(addMonths(date, 1)) // Get next month too for better UX

            const result = await getShiftsForDateRange(start, end)
            if (result.shifts) {
                setShifts(result.shifts)
            }
            setIsLoading(false)
        }

        fetchShifts()
    }, [date])

    // Convert shifts to calendar events
    const events: CalendarShift[] = useMemo(() => {
        let filteredShifts = shifts

        // Filter by worker
        if (selectedWorker !== 'all') {
            filteredShifts = filteredShifts.filter((s: any) => s.workerId === selectedWorker)
        }

        // Filter by service type
        if (selectedServiceType !== 'all') {
            filteredShifts = filteredShifts.filter((s: any) => s.serviceType === selectedServiceType)
        }

        return filteredShifts.map((shift: any) => ({
            id: shift.id,
            title: `${shift.client.name} - ${shift.worker.name}`,
            start: new Date(shift.startTime),
            end: new Date(shift.endTime),
            resource: {
                shiftId: shift.id,
                clientId: shift.client.id,
                clientName: shift.client.name,
                workerId: shift.worker.id,
                workerName: shift.worker.name,
                status: shift.status,
                serviceType: shift.serviceType,
                location: shift.location,
            }
        }))
    }, [shifts, selectedWorker, selectedServiceType])

    // Handle event drop (time change)
    const handleEventDrop = useCallback(async ({ event, start, end }: any) => {
        if (!canEdit) return

        // Optimistic update
        const updatedShifts = shifts.map((s: any) =>
            s.id === event.resource.shiftId
                ? { ...s, startTime: start, endTime: end }
                : s
        )
        setShifts(updatedShifts)

        // Server update
        const result = await updateShiftTimes(event.resource.shiftId, start, end)

        if (result.error) {
            // Rollback on error
            setShifts(shifts)
            alert(result.error)
        } else {
            router.refresh()
        }
    }, [shifts, canEdit, router])

    // Handle event resize
    const handleEventResize = useCallback(async ({ event, start, end }: any) => {
        if (!canEdit) return

        // Optimistic update
        const updatedShifts = shifts.map((s: any) =>
            s.id === event.resource.shiftId
                ? { ...s, startTime: start, endTime: end }
                : s
        )
        setShifts(updatedShifts)

        // Server update
        const result = await updateShiftTimes(event.resource.shiftId, start, end)

        if (result.error) {
            // Rollback on error
            setShifts(shifts)
            alert(result.error)
        } else {
            router.refresh()
        }
    }, [shifts, canEdit, router])

    // Handle event click (navigate to shift detail)
    const handleSelectEvent = useCallback((event: CalendarShift) => {
        router.push(`/dashboard/shifts/${event.resource.shiftId}`)
    }, [router])

    // Custom event style based on worker and status
    const eventStyleGetter = useCallback((event: CalendarShift) => {
        const workerColor = workerColorMap.get(event.resource.workerId) || '#6b7280'
        const opacity = event.resource.status === ShiftStatus.COMPLETED ? 0.6 : 1
        const borderStyle = event.resource.status === ShiftStatus.CANCELLED ? 'dashed' : 'solid'

        return {
            style: {
                backgroundColor: workerColor,
                opacity,
                borderStyle,
                borderWidth: '2px',
                borderColor: workerColor,
                borderRadius: '4px',
                color: 'white',
                fontSize: '0.875rem',
                padding: '2px 4px',
            }
        }
    }, [workerColorMap])

    // Navigate to previous period
    const handleNavigatePrev = () => {
        if (view === 'month') {
            setDate(addMonths(date, -1))
        } else if (view === 'week') {
            setDate(new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000))
        } else {
            setDate(new Date(date.getTime() - 24 * 60 * 60 * 1000))
        }
    }

    // Navigate to next period
    const handleNavigateNext = () => {
        if (view === 'month') {
            setDate(addMonths(date, 1))
        } else if (view === 'week') {
            setDate(new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000))
        } else {
            setDate(new Date(date.getTime() + 24 * 60 * 60 * 1000))
        }
    }

    // Navigate to today
    const handleToday = () => {
        setDate(new Date())
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleNavigatePrev}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleToday}>
                        Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNavigateNext}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <span className="font-semibold text-lg ml-2">
                        {format(date, 'MMMM yyyy')}
                    </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Worker filter */}
                    <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by worker" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Workers</SelectItem>
                            {workers.map((worker) => (
                                <SelectItem key={worker.id} value={worker.id}>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: workerColorMap.get(worker.id) }}
                                        />
                                        {worker.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Service Type filter */}
                    <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by service" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Service Types</SelectItem>
                            {NDIS_SERVICE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* View selector */}
                    <Select value={view} onValueChange={(v) => setView(v as View)}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="month">Month</SelectItem>
                            <SelectItem value="week">Week</SelectItem>
                            <SelectItem value="day">Day</SelectItem>
                            <SelectItem value="agenda">Agenda</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Permission notice */}
            {!canEdit && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg text-sm">
                    <p>📅 View-only mode. Only coordinators and admins can modify shifts.</p>
                </div>
            )}

            {/* Calendar */}
            <div className="bg-white rounded-lg border p-4" style={{ height: '700px' }}>
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-muted-foreground">Loading shifts...</div>
                    </div>
                ) : (
                    <DndProvider backend={HTML5Backend}>
                        <DragAndDropCalendar
                            localizer={localizer}
                            events={events}
                            view={view}
                            date={date}
                            onView={setView}
                            onNavigate={setDate}
                            onEventDrop={canEdit ? handleEventDrop : undefined}
                            onEventResize={canEdit ? handleEventResize : undefined}
                            onSelectEvent={handleSelectEvent as any}
                            eventPropGetter={eventStyleGetter as any}
                            resizable={canEdit}
                            draggableAccessor={() => canEdit}
                            style={{ height: '100%' }}
                            popup
                            tooltipAccessor={(event: any) => {
                                const parts = [
                                    event.resource.clientName,
                                    event.resource.workerName,
                                    event.resource.serviceType || 'No service type',
                                    event.resource.status
                                ]
                                return parts.join('\n')
                            }}
                        />
                    </DndProvider>
                )}
            </div>

            {/* Legend */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Legend</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded" />
                        <span>Planned</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 opacity-60 rounded" />
                        <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-dashed border-blue-500 rounded" />
                        <span>Cancelled</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Colors = Workers</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
