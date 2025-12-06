import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/api-auth'

// GET /api/v1/sites/[id]/sil-config
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { context, error } = await authenticateRequest(request)
        if (error) return error

        const { id: siteId } = await params

        // Get site with configuration
        const site = await prisma.site.findUnique({
            where: { id: siteId },
            include: {
                silConfiguration: true
            }
        })

        if (!site) {
            return NextResponse.json({ error: 'Site not found' }, { status: 404 })
        }

        // Check organization membership
        const membership = await prisma.organisationMember.findFirst({
            where: {
                userId: context!.userId,
                organisationId: site.organisationId
            }
        })

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        return NextResponse.json({
            siteId: site.id,
            siteName: site.name,
            isSILHouse: site.isSILHouse,
            houseType: site.houseType,
            capacity: site.capacity,
            silConfig: site.silConfiguration || null
        })
    } catch (error) {
        console.error('Error fetching SIL config:', error)
        return NextResponse.json(
            { error: 'Failed to fetch SIL configuration' },
            { status: 500 }
        )
    }
}

// PUT /api/v1/sites/[id]/sil-config
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { context, error } = await authenticateRequest(request)
        if (error) return error

        const { id: siteId } = await params
        const body = await request.json()

        // Get site
        const site = await prisma.site.findUnique({
            where: { id: siteId }
        })

        if (!site) {
            return NextResponse.json({ error: 'Site not found' }, { status: 404 })
        }

        // Check organization membership and permissions
        const membership = await prisma.organisationMember.findFirst({
            where: {
                userId: context!.userId,
                organisationId: site.organisationId
            }
        })

        if (!membership || !['ORG_ADMIN', 'COORDINATOR'].includes(membership.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Update site basic info
        await prisma.site.update({
            where: { id: siteId },
            data: {
                isSILHouse: body.isSILHouse ?? site.isSILHouse,
                houseType: body.houseType ?? site.houseType,
                capacity: body.capacity ?? site.capacity
            }
        })

        // Update or create SIL configuration if it's a SIL house
        if (body.isSILHouse && body.silConfig) {
            const config = await prisma.sILHouseConfiguration.upsert({
                where: { siteId },
                create: {
                    siteId,
                    minimumStaffRatio: body.silConfig.minimumStaffRatio || 'ONE_TO_ONE',
                    requiresOvernightStaff: body.silConfig.requiresOvernightStaff ?? true,
                    requires24x7Coverage: body.silConfig.requires24x7Coverage ?? true,
                    minActiveHoursPerDay: body.silConfig.minActiveHoursPerDay ?? 16,
                    maxSleepoverHoursPerDay: body.silConfig.maxSleepoverHoursPerDay ?? 8,
                    allowsSleepoverShifts: body.silConfig.allowsSleepoverShifts ?? true,
                    totalResidents: body.silConfig.totalResidents ?? 1,
                    maxResidentsPerWorker: body.silConfig.maxResidentsPerWorker ?? 3,
                    requiresMaleStaff: body.silConfig.requiresMaleStaff ?? false,
                    requiresFemaleStaff: body.silConfig.requiresFemaleStaff ?? false,
                    preferredGenderMix: body.silConfig.preferredGenderMix,
                    preferConsistentStaff: body.silConfig.preferConsistentStaff ?? true,
                    maxNewStaffPerWeek: body.silConfig.maxNewStaffPerWeek ?? 2,
                    minShiftsBeforeAlone: body.silConfig.minShiftsBeforeAlone ?? 3,
                    overnightSupportRatio: body.silConfig.overnightSupportRatio,
                    allowsSingleOvernightStaff: body.silConfig.allowsSingleOvernightStaff ?? false,
                    requiresOnCallBackup: body.silConfig.requiresOnCallBackup ?? true,
                    emergencyContactRequired: body.silConfig.emergencyContactRequired ?? true
                },
                update: {
                    minimumStaffRatio: body.silConfig.minimumStaffRatio,
                    requiresOvernightStaff: body.silConfig.requiresOvernightStaff,
                    requires24x7Coverage: body.silConfig.requires24x7Coverage,
                    minActiveHoursPerDay: body.silConfig.minActiveHoursPerDay,
                    maxSleepoverHoursPerDay: body.silConfig.maxSleepoverHoursPerDay,
                    allowsSleepoverShifts: body.silConfig.allowsSleepoverShifts,
                    totalResidents: body.silConfig.totalResidents,
                    maxResidentsPerWorker: body.silConfig.maxResidentsPerWorker,
                    requiresMaleStaff: body.silConfig.requiresMaleStaff,
                    requiresFemaleStaff: body.silConfig.requiresFemaleStaff,
                    preferredGenderMix: body.silConfig.preferredGenderMix,
                    preferConsistentStaff: body.silConfig.preferConsistentStaff,
                    maxNewStaffPerWeek: body.silConfig.maxNewStaffPerWeek,
                    minShiftsBeforeAlone: body.silConfig.minShiftsBeforeAlone,
                    overnightSupportRatio: body.silConfig.overnightSupportRatio,
                    allowsSingleOvernightStaff: body.silConfig.allowsSingleOvernightStaff,
                    requiresOnCallBackup: body.silConfig.requiresOnCallBackup,
                    emergencyContactRequired: body.silConfig.emergencyContactRequired
                }
            })

            return NextResponse.json({
                success: true,
                silConfig: config
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating SIL config:', error)
        return NextResponse.json(
            { error: 'Failed to update SIL configuration' },
            { status: 500 }
        )
    }
}
