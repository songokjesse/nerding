import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function RosteringLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="border-b bg-white px-6 py-3">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-800">Rostering</h2>
                    <div className="h-6 w-px bg-gray-200" />
                    <nav className="flex items-center gap-2">
                        <Link href="/dashboard/rostering">
                            <Button variant="ghost" size="sm">Overview</Button>
                        </Link>
                        <Link href="/dashboard/rostering/calendar">
                            <Button variant="ghost" size="sm">Calendar</Button>
                        </Link>
                        <Link href="/dashboard/rostering/availability">
                            <Button variant="ghost" size="sm">Availability</Button>
                        </Link>
                        <Link href="/dashboard/rostering/rules">
                            <Button variant="ghost" size="sm">Rules</Button>
                        </Link>
                    </nav>
                </div>
            </div>
            <div className="flex-1 p-6">
                {children}
            </div>
        </div>
    )
}
