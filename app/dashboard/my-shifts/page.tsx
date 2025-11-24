import { getMyShifts } from '../shifts/actions'
import { MyShiftsListView } from '@/components/dashboard/my-shifts-list-view'

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

    return (
        <div className="p-6">
            <MyShiftsListView shifts={shifts || []} />
        </div>
    )
}
