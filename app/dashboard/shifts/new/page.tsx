import { getClients } from '../../clients/actions'
import { getOrganizationWorkers } from '../actions'
import { ShiftForm } from '@/components/dashboard/shift-form'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { OrgRole } from '@/generated/prisma/client/enums'

export default async function NewShiftPage() {
    // Check authentication and permissions
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session?.user) {
        redirect('/sign-in')
    }

    // Check if user has coordinator permissions
    const membership = await prisma.organisationMember.findFirst({
        where: { userId: session.user.id }
    })

    if (!membership || ![OrgRole.ORG_ADMIN, OrgRole.COORDINATOR].includes(membership.role)) {
        redirect('/dashboard')
    }

    // Fetch clients and workers
    const [clientsResult, workersResult] = await Promise.all([
        getClients(),
        getOrganizationWorkers()
    ])

    if (clientsResult.error || workersResult.error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    <p className="font-medium">Error loading form data</p>
                    <p className="text-sm mt-1">
                        {clientsResult.error || workersResult.error}
                    </p>
                </div>
            </div>
        )
    }

    const clients = clientsResult.clients || []
    const workers = workersResult.workers || []

    if (clients.length === 0) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
                    <p className="font-medium">No clients found</p>
                    <p className="text-sm mt-1">
                        You need to create at least one client before scheduling shifts.
                    </p>
                    <a href="/dashboard/clients/new" className="text-yellow-800 underline mt-2 inline-block">
                        Create a client
                    </a>
                </div>
            </div>
        )
    }

    if (workers.length === 0) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
                    <p className="font-medium">No workers found</p>
                    <p className="text-sm mt-1">
                        You need to have at least one team member before scheduling shifts.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <ShiftForm clients={clients} workers={workers} />
        </div>
    )
}
