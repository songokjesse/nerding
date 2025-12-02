"use client"

import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { useState, useEffect } from 'react'
import { getShiftsForDateRange, updateShiftTimes } from '@/app/dashboard/shifts/actions'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

const localizer = momentLocalizer(moment)
const DnDCalendar = withDragAndDrop(Calendar as any)

interface RosterCalendarProps {
    initialShifts?: any[]
}

export function RosterCalendar({ initialShifts = [] }: RosterCalendarProps) {
    const [events, setEvents] = useState<any[]>(initialShifts)
    const [view, setView] = useState<any>(Views.WEEK)
    const [date, setDate] = useState(new Date())
    const router = useRouter()
    const { toast } = useToast()

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

            const { shifts, error } = await getShiftsForDateRange(start, end)
            if (shifts) {
                const mappedEvents = shifts.map((shift: any) => ({
                    id: shift.id,
                    title: `${shift.client?.name || 'Unknown Client'} - ${shift.worker?.name || 'Unassigned'}`,
                    start: new Date(shift.startTime),
                    end: new Date(shift.endTime),
                    resource: shift,
                    allDay: false
                }))
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
                description: "Shift time has been updated successfully."
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

        // Priority 1: Validation Errors (Red)
        if (validationStatus === 'BLOCKED' || validationStatus === 'WARNING') {
            backgroundColor = '#ef4444' // Red-500
        }
        // Priority 2: Shift Status
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
