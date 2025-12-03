"use client"

import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { useState, useEffect, useMemo } from 'react'
import { getShiftsForDateRange, updateShiftTimes } from '@/app/dashboard/shifts/actions'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { getWorkerHoursMap, formatHoursDisplay } from '@/lib/rostering/calculate-worker-hours'

const localizer = momentLocalizer(moment)
const DnDCalendar = withDragAndDrop(Calendar as any)

interface RosterCalendarProps {
    initialShifts?: any[]
}

export function RosterCalendar({ initialShifts = [] }: RosterCalendarProps) {
    const [events, setEvents] = useState<any[]>(initialShifts)
    const [view, setView] = useState<any>(Views.WEEK)
    const [date, setDate] = useState(new Date())
    const [allShifts, setAllShifts] = useState<any[]>([])
    const [workers, setWorkers] = useState<any[]>([])
    const router = useRouter()
    const { toast } = useToast()

    // Calculate worker hours map
    const workerHoursMap = useMemo(() => {
        if (!allShifts.length || !workers.length) return {}
        return getWorkerHoursMap(allShifts, workers)
    }, [allShifts, workers])

    // Fetch shifts when view or date changes
    useEffect(() => {
        const fetchShifts = async () => {
            let start, end

            if (view === Views.MONTH) {
                start = moment(date).startOf('month').toDate()
                end = moment(date).endOf('month').toDate()
            } else if (view === Views.WEEK) {
                start = moment(date).startOf('week').toDate()
                end = moment(date).endOf('week').toDate()
            } else {
                start = moment(date).startOf('day').toDate()
                end = moment(date).endOf('day').toDate()
            }

            const { shifts, workers: fetchedWorkers, error } = await getShiftsForDateRange(start, end)
            if (shifts) {
                setAllShifts(shifts)
                setWorkers(fetchedWorkers || [])

                const mappedEvents = shifts.map((shift: any) => {
                    const workerId = shift.shiftWorkerLink?.[0]?.workerId
                    const workerName = shift.worker?.name || 'Unassigned'
                    const clientName = shift.client?.name || 'Unknown Client'

                    // Get worker hours info
                    const hoursInfo = workerId && fetchedWorkers ?
                        getWorkerHoursMap(shifts, fetchedWorkers)[workerId] : null

                    // Format title with hours
                    let title = `${clientName} - ${workerName}`
                    if (hoursInfo && hoursInfo.maxHours) {
                        title += ` (${formatHoursDisplay(hoursInfo)})`
                    }

                    return {
                        id: shift.id,
                        title,
                        start: new Date(shift.startTime),
                        end: new Date(shift.endTime),
                        resource: { ...shift, hoursInfo },
                        allDay: false
                    }
                })
                setEvents(mappedEvents)
            }
        }

        fetchShifts()
    }, [date, view])

    const handleEventDrop = async ({ event, start, end }: any) => {
        const updatedEvents = events.map(evt => {
            if (evt.id === event.id) {
                return { ...evt, start, end }
            }
            return evt
        })
        setEvents(updatedEvents)

        const result = await updateShiftTimes(event.id, start, end)
        if (result.error) {
            toast({
                title: "Error updating shift",
                description: result.error,
                variant: "destructive"
            })
            // Revert changes (could refetch here)
        } else {
            toast({
                title: "Shift updated",
                description: "Shift time has been updated successfully.",
                variant: "success"
            })
        }
    }

    const handleSelectEvent = (event: any) => {
        router.push(`/dashboard/shifts/${event.id}`)
    }

    const eventStyleGetter = (event: any) => {
        let backgroundColor = '#3174ad'
        const status = event.resource.status
        const validationStatus = event.resource.validationStatus
        const hoursInfo = event.resource.hoursInfo

        // Priority 1: Hour Limit Exceeded (Red)
        if (hoursInfo && hoursInfo.exceeds) {
            backgroundColor = '#ef4444' // Red-500 for exceeded hours
        }
        // Priority 2: Validation Warnings (Amber)
        else if (validationStatus === 'WARNING') {
            backgroundColor = '#f59e0b' // Amber-500
        }
        // Priority 3: Validation Blocked (Red)
        else if (validationStatus === 'BLOCKED') {
            backgroundColor = '#ef4444' // Red-500
        }
        // Priority 4: Shift Status
        else {
            if (status === 'COMPLETED') backgroundColor = '#10b981'
            if (status === 'CANCELLED') backgroundColor = '#6b7280' // Gray for cancelled
            if (status === 'IN_PROGRESS') backgroundColor = '#8b5cf6'
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        }
    }

    return (
        <div className="h-[calc(100vh-200px)] bg-white p-4 rounded-lg shadow">
            <DnDCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                draggableAccessor={() => true}
                resizable={true}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventDrop}
            />
        </div>
    )
}
