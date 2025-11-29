import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    const searchParams = request.nextUrl.searchParams
    const shiftId = searchParams.get('shiftId')
    const clientId = searchParams.get('clientId')
    const siteId = searchParams.get('siteId')

    try {
        const where: any = {
            organisationId: context!.organisationId
        }

        if (shiftId) where.shiftId = shiftId
        if (clientId) where.clientId = clientId
        if (siteId) where.siteId = siteId

        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                client: { select: { name: true } },
                site: { select: { name: true } }
            },
            orderBy: { startTime: 'asc' }
        })

        return successResponse({ appointments })
    } catch (err) {
        console.error('Error fetching appointments:', err)
        return errorResponse('Failed to fetch appointments', 'INTERNAL_ERROR', 500)
    }
}

export async function POST(request: NextRequest) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const body = await request.json()
        const { title, description, startTime, endTime, durationMinutes, siteId, clientId, shiftId } = body

        if (!title || !startTime) {
            return errorResponse('Title and Start Time are required', 'INVALID_INPUT', 400)
        }

        const appointment = await prisma.appointment.create({
            data: {
                organisationId: context!.organisationId,
                title,
                description,
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : null,
                durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
                siteId,
                clientId,
                shiftId,
                status: 'SCHEDULED'
            }
        })

        return successResponse({ appointment }, 201)
    } catch (err) {
        console.error('Error creating appointment:', err)
        return errorResponse('Failed to create appointment', 'INTERNAL_ERROR', 500)
    }
}
