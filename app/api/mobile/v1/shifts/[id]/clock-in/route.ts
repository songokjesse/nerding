import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import { getWorkerShiftWhereClause } from '@/lib/mobile-api-helpers'
import prisma from '@/lib/prisma'
import { ShiftStatus } from '@/generated/prisma/client/enums'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Authenticate request
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { id } = await params
        const body = await request.json()
        const { location } = body

        // Verify shift access
        const shift = await prisma.shift.findFirst({
            where: getWorkerShiftWhereClause(id, context!.userId, context!.organisationId)
        })

        if (!shift) {
            return errorResponse('Shift not found or access denied', 'NOT_FOUND', 404)
        }

        // Verify shift status
        if (shift.status !== ShiftStatus.PLANNED) {
            return errorResponse('Shift must be PLANNED to clock in', 'INVALID_STATE', 400)
        }

        // Update shift
        const updatedShift = await prisma.shift.update({
            where: { id },
            data: {
                status: ShiftStatus.IN_PROGRESS,
                clockInTime: new Date(),
                clockInLocation: location || undefined
            }
        })

        return successResponse({
            shift: {
                id: updatedShift.id,
                status: updatedShift.status,
                clockInTime: updatedShift.clockInTime?.toLocaleString('sv-SE').replace(' ', 'T'),
                clockInLocation: updatedShift.clockInLocation
            }
        })

    } catch (err) {
        console.error('Error clocking in:', err)
        return errorResponse('Failed to clock in', 'INTERNAL_ERROR', 500)
    }
}
