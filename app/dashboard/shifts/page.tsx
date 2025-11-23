import { getShifts } from './actions'
import { ShiftCard } from '@/components/dashboard/shift-card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { OrgRole } from '@/generated/prisma/client/enums'

export default async function ShiftsPage() {
    const session = await auth.api.getSession({ headers: await headers() })

    // Check permissions for "Create Shift" button
    const membership = await prisma.organisationMember.findFirst({
        where: { userId: session?.user?.id }
    })
    const canCreate = membership && [OrgRole.ORG_ADMIN, OrgRole.COORDINATOR].includes(membership.role)

    const { shifts, error } = await getShifts()

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    <p className="font-medium">Error loading shifts</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        )
    }

    // Separate upcoming and past shifts
    const now = new Date()
    const upcomingShifts = shifts?.filter(s => new Date(s.startTime) >= now) || []
    const pastShifts = shifts?.filter(s => new Date(s.startTime) < now) || []

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Shifts</h1>
                {canCreate && (
                    <Link href="/dashboard/shifts/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Shift
                        </Button>
                    </Link>
                )}
            </div>

            {/* Upcoming Shifts */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Upcoming Shifts</h2>
                {upcomingShifts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        No upcoming shifts scheduled
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {upcomingShifts.map((shift) => (
                            <ShiftCard key={shift.id} shift={shift} />
                        ))}
                    </div>
                )}
            </div>

            {/* Past Shifts */}
            {pastShifts.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Past Shifts</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pastShifts.map((shift) => (
                            <ShiftCard key={shift.id} shift={shift} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
