import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Settings, Clock } from "lucide-react"
import Link from "next/link"

export default function RosteringPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Rostering Overview</h1>
                <p className="text-muted-foreground mt-2">
                    Manage shifts, worker availability, and rostering rules.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/dashboard/rostering/calendar">
                    <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Calendar
                            </CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Schedule</div>
                            <p className="text-xs text-muted-foreground">
                                View and manage shift calendar
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/rostering/availability">
                    <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Availability
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Workers</div>
                            <p className="text-xs text-muted-foreground">
                                Manage worker availability
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/rostering/rules">
                    <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Rules
                            </CardTitle>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Configuration</div>
                            <p className="text-xs text-muted-foreground">
                                Set rostering constraints
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Card className="h-full opacity-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Suggestions (Coming Soon)
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">AI Powered</div>
                        <p className="text-xs text-muted-foreground">
                            Automated roster suggestions
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
