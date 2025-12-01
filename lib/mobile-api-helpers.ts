// Helper script to create reusable where clause for worker authorization
// This ensures consistency across all mobile shift API endpoints

export function getWorkerShiftWhereClause(
    shiftId: string,
    workerId: string,
    organisationId: string
) {
    return {
        id: shiftId,
        organisationId,
        shiftWorkerLink: {
            some: {
                workerId
            }
        }
    }
}
