import { RosterCalendar } from "@/components/dashboard/roster-calendar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function CalendarPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Roster Calendar</h1>
                    <p className="text-muted-foreground">
                        View and manage shifts in a calendar view.
                    </p>
                </div>
                <Link href="/dashboard/rostering/shifts/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Shift
                    </Button>
                </Link>
            </div>

            <RosterCalendar />
        </div>
    )
}
