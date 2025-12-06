import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/api-auth'

// GET /api/v1/clients/[id]/ndis-config
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { context, error } = await authenticateRequest(request)
        if (error) return error

        const { id: clientId } = await params

        // Get client with requirements
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: {
                requirements: true
            }
        })

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        // Check organization membership
        const membership = await prisma.organisationMember.findFirst({
            where: {
                userId: context!.userId,
                organisationId: client.organisationId
            }
        })

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        return NextResponse.json({
            clientId: client.id,
            clientName: client.name,
            ndisConfig: {
                supportRatio: client.requirements?.supportRatio || 'ONE_TO_ONE',
                requiresOvernightSupport: client.requirements?.requiresOvernightSupport || false,
                allowsSleepoverShifts: client.requirements?.allowsSleepoverShifts || false,
                ndisAllocatedHours: client.requirements?.ndisAllocatedHours,
                ndisFundingPeriod: client.requirements?.ndisFundingPeriod,
                ndisPlanStartDate: client.requirements?.ndisPlanStartDate,
                ndisPlanEndDate: client.requirements?.ndisPlanEndDate,
                hoursUsedThisPeriod: client.requirements?.hoursUsedThisPeriod || 0,
                hoursRemainingThisPeriod: client.requirements?.hoursRemainingThisPeriod,
                lastHoursUpdate: client.requirements?.lastHoursUpdate,
                isSILResident: client.requirements?.isSILResident || false,
                requiresConsistentStaff: client.requirements?.requiresConsistentStaff || false,
                maxNewStaffPerMonth: client.requirements?.maxNewStaffPerMonth,
                preferredShiftTimes: client.requirements?.preferredShiftTimes
            }
        })
    } catch (error) {
        console.error('Error fetching NDIS config:', error)
        return NextResponse.json(
            { error: 'Failed to fetch NDIS configuration' },
            { status: 500 }
        )
    }
}

// PUT /api/v1/clients/[id]/ndis-config
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { context, error } = await authenticateRequest(request)
        if (error) return error

        const { id: clientId } = await params
        const body = await request.json()

        // Get client
        const client = await prisma.client.findUnique({
            where: { id: clientId }
        })

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        // Check organization membership and permissions
        const membership = await prisma.organisationMember.findFirst({
            where: {
                userId: context!.userId,
                organisationId: client.organisationId
            }
        })

        if (!membership || !['ORG_ADMIN', 'COORDINATOR'].includes(membership.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Calculate hours remaining if allocated hours changed
        let hoursRemaining = body.hoursRemainingThisPeriod
        if (body.ndisAllocatedHours !== undefined) {
            const hoursUsed = body.hoursUsedThisPeriod || 0
            hoursRemaining = body.ndisAllocatedHours - hoursUsed
        }

        // Update or create client requirements
        const requirements = await prisma.clientRequirement.upsert({
            where: { clientId },
            create: {
                clientId,
                supportRatio: body.supportRatio || 'ONE_TO_ONE',
                requiresOvernightSupport: body.requiresOvernightSupport || false,
                allowsSleepoverShifts: body.allowsSleepoverShifts || false,
                ndisAllocatedHours: body.ndisAllocatedHours,
                ndisFundingPeriod: body.ndisFundingPeriod,
                ndisPlanStartDate: body.ndisPlanStartDate ? new Date(body.ndisPlanStartDate) : undefined,
                ndisPlanEndDate: body.ndisPlanEndDate ? new Date(body.ndisPlanEndDate) : undefined,
                hoursUsedThisPeriod: body.hoursUsedThisPeriod || 0,
                hoursRemainingThisPeriod: hoursRemaining,
                lastHoursUpdate: new Date(),
                isSILResident: body.isSILResident || false,
                requiresConsistentStaff: body.requiresConsistentStaff || false,
                maxNewStaffPerMonth: body.maxNewStaffPerMonth,
                preferredShiftTimes: body.preferredShiftTimes
            },
            update: {
                supportRatio: body.supportRatio,
                requiresOvernightSupport: body.requiresOvernightSupport,
                allowsSleepoverShifts: body.allowsSleepoverShifts,
                ndisAllocatedHours: body.ndisAllocatedHours,
                ndisFundingPeriod: body.ndisFundingPeriod,
                ndisPlanStartDate: body.ndisPlanStartDate ? new Date(body.ndisPlanStartDate) : undefined,
                ndisPlanEndDate: body.ndisPlanEndDate ? new Date(body.ndisPlanEndDate) : undefined,
                hoursUsedThisPeriod: body.hoursUsedThisPeriod,
                hoursRemainingThisPeriod: hoursRemaining,
                lastHoursUpdate: new Date(),
                isSILResident: body.isSILResident,
                requiresConsistentStaff: body.requiresConsistentStaff,
                maxNewStaffPerMonth: body.maxNewStaffPerMonth,
                preferredShiftTimes: body.preferredShiftTimes
            }
        })

        return NextResponse.json({
            success: true,
            ndisConfig: requirements
        })
    } catch (error) {
        console.error('Error updating NDIS config:', error)
        return NextResponse.json(
            { error: 'Failed to update NDIS configuration' },
            { status: 500 }
        )
    }
}
