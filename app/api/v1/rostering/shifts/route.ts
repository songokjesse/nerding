import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { ShiftStatus } from '@/generated/prisma/client/enums'
import type { CreateShiftDto, ShiftResponseDto } from '@/lib/rostering/types'
import { updateClientHoursTracking } from '@/lib/ndis/hour-tracking'
import { rulesEngine } from '@/lib/rostering/rules-engine'

/**
 * GET /api/v1/rostering/shifts
 * List shifts with advanced filtering for rostering
 */
export async function GET(request: NextRequest) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const workerId = searchParams.get('workerId')
        const clientId = searchParams.get('clientId')
        const siteId = searchParams.get('siteId')
        const status = searchParams.get('status') as ShiftStatus | null

        // Build where clause
        const where: any = {
            organisationId: context!.organisationId
        }

        // Date filters
        if (startDate || endDate) {
            where.startTime = {}
            if (startDate) where.startTime.gte = new Date(startDate)
            if (endDate) where.startTime.lte = new Date(endDate)
        }

        // Status filter
        if (status && Object.values(ShiftStatus).includes(status)) {
            where.status = status
        }

        // Site filter
        if (siteId) {
            where.siteId = siteId
        }

        // Worker filter (via join table)
        if (workerId) {
            where.shiftWorkerLink = {
                some: {
                    workerId: workerId
                }
            }
        }

        // Client filter (via join table)
        if (clientId) {
            where.shiftClientLink = {
                some: {
                    clientId: clientId
                }
            }
        }

        // Fetch shifts with relationships
        const shifts = await prisma.shift.findMany({
            where,
            include: {
                shiftWorkerLink: {
                    include: {
                        worker: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                qualifications: true
                            }
                        }
                    }
                },
                shiftClientLink: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                name: true,
                                ndisNumber: true,
                                enabledModules: {
                                    where: { isEnabled: true },
                                    select: { moduleType: true }
                                }
                            }
                        }
                    }
                },
                site: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                    }
                },
                _count: {
                    select: {
                        progressNotes: true
                    }
                }
            },
            orderBy: { startTime: 'asc' }
        })

        // Transform to response format
        const shiftsResponse: ShiftResponseDto[] = await Promise.all(
            shifts.map(async (shift) => {
                // Count observations
                const observationsCount = await prisma.observation.count({
                    where: {
                        progressNote: {
                            shiftId: shift.id
                        }
                    }
                })

                return {
                    id: shift.id,
                    startTime: shift.startTime.toISOString(),
                    endTime: shift.endTime.toISOString(),
                    status: shift.status,
                    serviceType: shift.serviceType,
                    location: shift.location,
                    workers: shift.shiftWorkerLink.map(sw => ({
                        id: sw.worker.id,
                        name: sw.worker.name,
                        email: sw.worker.email,
                        qualifications: sw.worker.qualifications
                    })),
                    clients: shift.shiftClientLink.map(sc => ({
                        id: sc.client.id,
                        name: sc.client.name,
                        ndisNumber: sc.client.ndisNumber,
                        enabledModules: sc.client.enabledModules.map(m => m.moduleType)
                    })),
                    site: shift.site,
                    clockInTime: shift.clockInTime?.toISOString() || null,
                    clockOutTime: shift.clockOutTime?.toISOString() || null,
                    progressNotesCount: shift._count.progressNotes,
                    observationsCount
                }
            })
        )

        return successResponse({ shifts: shiftsResponse })
    } catch (err) {
        console.error('Error fetching rostering shifts:', err)
        return errorResponse('Failed to fetch shifts', 'INTERNAL_ERROR', 500)
    }
}

/**
 * POST /api/v1/rostering/shifts
 * Create a new shift with multiple workers and clients
 */
export async function POST(request: NextRequest) {
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const body: CreateShiftDto = await request.json()

        // Validate required fields
        if (!body.startTime || !body.endTime || !body.workerIds || body.workerIds.length === 0) {
            return errorResponse(
                'Missing required fields: startTime, endTime, and workerIds are required',
                'VALIDATION_ERROR',
                400
            )
        }

        // Validate dates
        const startTime = new Date(body.startTime)
        const endTime = new Date(body.endTime)
        if (startTime >= endTime) {
            return errorResponse('End time must be after start time', 'VALIDATION_ERROR', 400)
        }

        // Check that workers exist and belong to the organization
        const workers = await prisma.user.findMany({
            where: {
                id: { in: body.workerIds },
                organisationMemberships: {
                    some: {
                        organisationId: context!.organisationId
                    }
                }
            }
        })

        if (workers.length !== body.workerIds.length) {
            return errorResponse('One or more workers not found', 'NOT_FOUND', 404)
        }

        // Check clients if provided
        if (body.clientIds && body.clientIds.length > 0) {
            const clients = await prisma.client.findMany({
                where: {
                    id: { in: body.clientIds },
                    organisationId: context!.organisationId
                }
            })

            if (clients.length !== body.clientIds.length) {
                return errorResponse('One or more clients not found', 'NOT_FOUND', 404)
            }
        }

        // Check site if provided
        if (body.siteId) {
            const site = await prisma.site.findFirst({
                where: {
                    id: body.siteId,
                    organisationId: context!.organisationId
                }
            })

            if (!site) {
                return errorResponse('Site not found', 'NOT_FOUND', 404)
            }
        }

        // Optional: Validate shift before creation
        let validationWarnings: string[] = []
        if (body.validate !== false) { // Default to true
            // Get all clients with requirements for validation
            const clientsWithRequirements = body.clientIds && body.clientIds.length > 0
                ? await prisma.client.findMany({
                    where: {
                        id: { in: body.clientIds },
                        organisationId: context!.organisationId
                    },
                    include: { requirements: true }
                })
                : []

            // Validate each worker-client pairing
            for (const workerId of body.workerIds) {
                const worker = workers.find(w => w.id === workerId)
                if (!worker) continue

                const workerData = {
                    id: worker.id,
                    name: worker.name,
                    email: worker.email,
                    qualifications: worker.qualifications,
                    maxFortnightlyHours: worker.maxFortnightlyHours || undefined
                }

                for (const client of clientsWithRequirements) {
                    if (!client.requirements) continue

                    const clientData = {
                        id: client.id,
                        name: client.name,
                        requirements: {
                            requiresHighIntensity: client.requirements.requiresHighIntensity,
                            highIntensityTypes: client.requirements.highIntensityTypes,
                            genderPreference: client.requirements.genderPreference || undefined,
                            bannedWorkerIds: client.requirements.bannedWorkerIds,
                            preferredWorkerIds: client.requirements.preferredWorkerIds,
                            requiresBSP: client.requirements.requiresBSP,
                            bspRequires2to1: client.requirements.bspRequires2to1,
                            bspRequiredGender: client.requirements.bspRequiredGender || undefined,
                            bspRequiresPBS: client.requirements.bspRequiresPBS,
                            requiresTransfers: client.requirements.requiresTransfers,
                            riskLevel: client.requirements.riskLevel
                        }
                    }

                    const shiftData = {
                        startTime,
                        endTime,
                        shiftType: body.shiftType || 'STANDARD' as any,
                        isHighIntensity: client.requirements.requiresHighIntensity,
                        requiresTransport: body.requiresTransport || false,
                        travelDistance: body.travelDistance,
                        location: body.location,
                        serviceType: body.serviceType,
                        siteId: body.siteId
                    }

                    const violations = await rulesEngine.validateShiftAssignment(
                        shiftData,
                        workerData,
                        clientData
                    )

                    // Collect soft violations as warnings
                    const softViolations = violations.filter(v => v.severity === 'SOFT')
                    validationWarnings.push(...softViolations.map(v => v.message))

                    // Block on hard violations
                    const hardViolations = violations.filter(v => v.severity === 'HARD')
                    if (hardViolations.length > 0) {
                        console.error('Shift validation failed:', hardViolations)
                        return errorResponse(
                            `Shift validation failed: ${hardViolations.map(v => v.message).join(', ')}`,
                            'VALIDATION_ERROR',
                            400
                        )
                    }
                }
            }
        }

        // Create shift with workers and clients
        const shift = await prisma.shift.create({
            data: {
                organisationId: context!.organisationId,
                startTime,
                endTime,
                status: body.status || ShiftStatus.PLANNED,
                serviceType: body.serviceType,
                location: body.location,
                siteId: body.siteId,
                createdById: context!.userId,
                shiftType: body.shiftType || 'STANDARD' as any,
                isHighIntensity: body.isHighIntensity || false,
                requiresTransport: body.requiresTransport || false,
                travelDistance: body.travelDistance,
                shiftCategory: body.shiftCategory || 'ACTIVE' as any,
                supportRatio: body.supportRatio || 'ONE_TO_ONE' as any,
                // Create worker relationships
                shiftWorkerLink: {
                    create: body.workerIds.map(workerId => ({
                        workerId,
                        organisationId: context!.organisationId
                    }))
                },
                // Create client relationships if provided
                shiftClientLink: body.clientIds && body.clientIds.length > 0 ? {
                    create: body.clientIds.map(clientId => ({
                        clientId,
                        organisationId: context!.organisationId
                    }))
                } : undefined
            },
            include: {
                shiftWorkerLink: {
                    include: {
                        worker: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                qualifications: true
                            }
                        }
                    }
                },
                shiftClientLink: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                name: true,
                                ndisNumber: true,
                                enabledModules: {
                                    where: { isEnabled: true },
                                    select: { moduleType: true }
                                }
                            }
                        }
                    }
                },
                site: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                    }
                }
            }
        })

        // Update NDIS hour tracking for all clients
        if (body.clientIds && body.clientIds.length > 0) {
            await Promise.all(
                body.clientIds.map(async (clientId) => {
                    try {
                        await updateClientHoursTracking(clientId)
                    } catch (err) {
                        console.error(`Failed to update hours for client ${clientId}:`, err)
                        // Don't fail the request if hour tracking update fails
                    }
                })
            )
        }

        const response: ShiftResponseDto = {
            id: shift.id,
            startTime: shift.startTime.toISOString(),
            endTime: shift.endTime.toISOString(),
            status: shift.status,
            serviceType: shift.serviceType,
            location: shift.location,
            workers: shift.shiftWorkerLink.map(sw => ({
                id: sw.worker.id,
                name: sw.worker.name,
                email: sw.worker.email,
                qualifications: sw.worker.qualifications
            })),
            clients: shift.shiftClientLink.map(sc => ({
                id: sc.client.id,
                name: sc.client.name,
                ndisNumber: sc.client.ndisNumber,
                enabledModules: sc.client.enabledModules.map(m => m.moduleType)
            })),
            site: shift.site,
            clockInTime: null,
            clockOutTime: null
        }

        const responseData: any = { shift: response }

        // Include validation warnings if any
        if (validationWarnings.length > 0) {
            responseData.warnings = validationWarnings
            responseData.message = `Shift created successfully with ${validationWarnings.length} warning(s)`
        }

        return successResponse(responseData, 201)
    } catch (err) {
        console.error('Error creating shift:', err)
        return errorResponse('Failed to create shift', 'INTERNAL_ERROR', 500)
    }
}
