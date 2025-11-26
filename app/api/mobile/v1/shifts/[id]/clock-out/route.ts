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
        
        let body = {}
        try {
            body = await request.json()
        } catch (e) {
            console.warn('Failed to parse request body, assuming empty body')
        }
        
        const { location } = body as any

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

        // Handle idempotency - if already completed, return success
        if (shift.status === ShiftStatus.COMPLETED) {
            return successResponse({
                shift: {
                    id: shift.id,
                    status: shift.status,
                    clockOutTime: shift.clockOutTime?.toISOString(),
                    clockOutLocation: shift.clockOutLocation
                }
            })
        }

        // Verify shift status
        if (shift.status !== ShiftStatus.IN_PROGRESS) {
            return errorResponse(`Shift must be IN_PROGRESS to clock out (current status: ${shift.status})`, 'INVALID_STATE', 400)
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
        // Return the actual error message in development/test for easier debugging
        const message = err instanceof Error ? err.message : 'Failed to clock out'
        return errorResponse(message, 'INTERNAL_ERROR', 500)
    }
}
