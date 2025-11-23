import { getMyShifts } from '../shifts/actions'
import { ShiftCard } from '@/components/dashboard/shift-card'

export default async function MyShiftsPage() {
    const { shifts, error } = await getMyShifts()

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    <p className="font-medium">Error loading your shifts</p>
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
            <div>
                <h1 className="text-3xl font-bold">My Shifts</h1>
                <p className="text-muted-foreground mt-1">
                    View your assigned shifts and submit progress notes
                </p>
            </div>

            {/* Upcoming Shifts */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Upcoming Shifts</h2>
                {upcomingShifts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>No upcoming shifts assigned</p>
                        <p className="text-sm mt-2">Check back later or contact your coordinator</p>
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
                            <div key={shift.id} className="relative">
                                <ShiftCard shift={shift} />
                                {shift.progressNotes.length === 0 && (
                                    <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                                        No note
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
