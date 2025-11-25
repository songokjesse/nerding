import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
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
            where: {
                id,
                organisationId: context!.organisationId,
                workerId: context!.userId
            }
        })

        if (!shift) {
            return errorResponse('Shift not found or access denied', 'NOT_FOUND', 404)
        }

        // Verify shift status
        if (shift.status !== ShiftStatus.IN_PROGRESS) {
            return errorResponse('Shift must be IN_PROGRESS to clock out', 'INVALID_STATE', 400)
        }

        // Update shift
        const updatedShift = await prisma.shift.update({
            where: { id },
            data: {
                status: ShiftStatus.COMPLETED,
                clockOutTime: new Date(),
                clockOutLocation: location || undefined
            }
        })

        return successResponse({
            shift: {
                id: updatedShift.id,
                status: updatedShift.status,
                clockOutTime: updatedShift.clockOutTime?.toISOString(),
                clockOutLocation: updatedShift.clockOutLocation
            }
        })

    } catch (err) {
        console.error('Error clocking out:', err)
        return errorResponse('Failed to clock out', 'INTERNAL_ERROR', 500)
    }
}
