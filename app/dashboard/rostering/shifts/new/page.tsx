import { getClients } from '@/app/dashboard/clients/actions'
import { getOrganizationWorkers } from '@/app/dashboard/shifts/actions'
import { RosterShiftForm } from '@/components/dashboard/roster-shift-form'

export default async function NewRosterShiftPage() {
    const [clientsResult, workersResult] = await Promise.all([
        getClients(),
        getOrganizationWorkers()
    ])

    const clients = clientsResult.clients || []
    const workers = workersResult.workers || []

    return (
        <div className="container mx-auto py-6">
            <RosterShiftForm clients={clients} workers={workers} />
        </div>
    )
}
