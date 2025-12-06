import { getDashboardData, getClientsApproachingLimits } from './actions'
import { StatCard } from '@/components/dashboard/stat-card'
import { RecentClients } from '@/components/dashboard/recent-clients'
import { UpcomingShifts } from '@/components/dashboard/upcoming-shifts'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { HourUtilizationWidget } from '@/components/dashboard/hour-utilization-widget'
import { Users, UserCheck, Calendar, Building2 } from 'lucide-react'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session?.user) {
        redirect('/sign-in')
    }

    // Fetch dashboard data
    const [data, hourLimitsData] = await Promise.all([
        getDashboardData(),
        getClientsApproachingLimits()
    ])

    if ('error' in data) {
        return (
            <main className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    <p className="font-medium">Error loading dashboard</p>
                    <p className="text-sm mt-1">{data.error}</p>
                </div>
            </main>
        )
    }

    const { organisation, stats, recentClients, upcomingShifts, recentNotes } = data

    return (
        <main className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Welcome back, {session.user.name}!
                </p>
            </div>

            {/* Organization Info */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8" />
                    <div>
                        <h2 className="text-2xl font-bold">{organisation.name}</h2>
                        <p className="text-blue-100 text-sm">
                            Plan: {organisation.plan.charAt(0).toUpperCase() + organisation.plan.slice(1)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Total Clients"
                    value={stats.clientCount}
                    icon={Users}
                    description="Active clients in your organization"
                />
                <StatCard
                    title="Team Members"
                    value={stats.memberCount}
                    icon={UserCheck}
                    description="Staff members in your organization"
                />
                <StatCard
                    title="Shifts This Week"
                    value={stats.shiftsThisWeek}
                    icon={Calendar}
                    description="Scheduled shifts for this week"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                    <RecentClients clients={recentClients} />
                    {hourLimitsData.clients.length > 0 && (
                        <HourUtilizationWidget clients={hourLimitsData.clients} />
                    )}
                    <UpcomingShifts shifts={upcomingShifts} />
                </div>

                {/* Right Column - 1/3 width */}
                <div className="space-y-6">
                    <QuickActions />
                    <RecentActivity notes={recentNotes} />
                </div>
            </div>
        </main>
    )
}
