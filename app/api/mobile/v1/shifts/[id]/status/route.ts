import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import { getWorkerShiftWhereClause } from '@/lib/mobile-api-helpers'
import prisma from '@/lib/prisma'
import { ShiftStatus } from '@/generated/prisma/client/enums'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Authenticate request
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { id } = await params
        const body = await request.json()
        const { status } = body

        // Validate status
        if (!status || !Object.values(ShiftStatus).includes(status)) {
            return errorResponse('Invalid status value', 'INVALID_INPUT', 400)
        }

        // Check if shift exists and belongs to worker
        const shift = await prisma.shift.findFirst({
            where: getWorkerShiftWhereClause(id, context!.userId, context!.organisationId)
        })

        if (!shift) {
            return errorResponse('Shift not found or access denied', 'NOT_FOUND', 404)
        }

        // Update shift status
        const updatedShift = await prisma.shift.update({
            where: { id },
            data: { status },
            select: {
                id: true,
                status: true,
                startTime: true,
                endTime: true
            }
        })

        return successResponse({
            shift: {
                id: updatedShift.id,
                status: updatedShift.status,
                startTime: updatedShift.startTime.toLocaleString('sv-SE').replace(' ', 'T'),
                endTime: updatedShift.endTime.toLocaleString('sv-SE').replace(' ', 'T')
            }
        })

    } catch (err) {
        console.error('Error updating shift status:', err)
        return errorResponse('Failed to update shift status', 'INTERNAL_ERROR', 500)
    }
}
