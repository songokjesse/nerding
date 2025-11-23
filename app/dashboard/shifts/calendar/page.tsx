import { CalendarView } from '@/components/dashboard/calendar-view'
import { getShiftsForDateRange, getOrganizationWorkers } from '../actions'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { OrgRole } from '@/generated/prisma/client/enums'
import { Button } from '@/components/ui/button'
import { List } from 'lucide-react'
import Link from 'next/link'
import { startOfMonth, endOfMonth, addMonths } from 'date-fns'

export default async function CalendarPage() {
    const session = await auth.api.getSession({ headers: await headers() })

    // Check permissions
    const membership = await prisma.organisationMember.findFirst({
        where: { userId: session?.user?.id }
    })
    const canEdit = membership && ([OrgRole.ORG_ADMIN, OrgRole.COORDINATOR] as OrgRole[]).includes(membership.role)

    // Fetch initial shifts for current month
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(addMonths(now, 1))

    const [shiftsResult, workersResult] = await Promise.all([
        getShiftsForDateRange(start, end),
        getOrganizationWorkers()
    ])

    if (shiftsResult.error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    <p className="font-medium">Error loading calendar</p>
                    <p className="text-sm mt-1">{shiftsResult.error}</p>
                </div>
            </div>
        )
    }

    if (workersResult.error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    <p className="font-medium">Error loading workers</p>
                    <p className="text-sm mt-1">{workersResult.error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header with view toggle */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Shift Calendar</h1>
                <div className="flex gap-2">
                    <Link href="/dashboard/shifts">
                        <Button variant="outline">
                            <List className="w-4 h-4 mr-2" />
                            List View
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Calendar Component */}
            <CalendarView
                initialShifts={shiftsResult.shifts || []}
                workers={workersResult.workers || []}
                canEdit={!!canEdit}
            />
        </div>
    )
}
