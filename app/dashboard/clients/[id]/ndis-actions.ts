'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'

export interface NDISConfigData {
    supportRatio?: 'ONE_TO_ONE' | 'TWO_TO_ONE' | 'THREE_TO_ONE' | 'ONE_TO_TWO' | 'ONE_TO_THREE' | 'ONE_TO_FOUR'
    requiresOvernightSupport?: boolean
    allowsSleepoverShifts?: boolean
    ndisAllocatedHours?: number
    ndisFundingPeriod?: string
    ndisPlanStartDate?: string
    ndisPlanEndDate?: string
    isSILResident?: boolean
    requiresConsistentStaff?: boolean
    maxNewStaffPerMonth?: number
    preferredShiftTimes?: any
}

export interface NDISConfigResponse {
    clientId: string
    clientName: string
    ndisConfig: {
        supportRatio: string
        requiresOvernightSupport: boolean
        allowsSleepoverShifts: boolean
        ndisAllocatedHours: number | null
        ndisFundingPeriod: string | null
        ndisPlanStartDate: string | null
        ndisPlanEndDate: string | null
        hoursUsedThisPeriod: number
        hoursRemainingThisPeriod: number | null
        lastHoursUpdate: string | null
        isSILResident: boolean
        requiresConsistentStaff: boolean
        maxNewStaffPerMonth: number | null
        preferredShiftTimes: any
    }
}

/**
 * Get NDIS configuration for a client
 */
export async function getNDISConfig(clientId: string): Promise<{ config: NDISConfigResponse | null; error?: string }> {
    try {
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session?.user) {
            return { config: null, error: 'Unauthorized' }
        }

        // Get organization membership
        const membership = await prisma.organisationMember.findFirst({
            where: { userId: session.user.id }
        })

        if (!membership) {
            return { config: null, error: 'No organization membership found' }
        }

        // Fetch from API
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/clients/${clientId}/ndis-config`, {
            headers: {
                'Cookie': (await headers()).get('cookie') || ''
            }
        })

        if (!response.ok) {
            if (response.status === 404) {
                return { config: null, error: 'Client not found' }
            }
            return { config: null, error: 'Failed to fetch NDIS configuration' }
        }

        const data = await response.json()
        return { config: data }
    } catch (error) {
        console.error('Error fetching NDIS config:', error)
        return { config: null, error: 'An error occurred while fetching NDIS configuration' }
    }
}

/**
 * Update NDIS configuration for a client
 */
export async function updateNDISConfig(
    clientId: string,
    data: NDISConfigData
): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session?.user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Get organization membership
        const membership = await prisma.organisationMember.findFirst({
            where: { userId: session.user.id }
        })

        if (!membership) {
            return { success: false, error: 'No organization membership found' }
        }

        // Check permissions
        if (!['ORG_ADMIN', 'COORDINATOR'].includes(membership.role)) {
            return { success: false, error: 'Insufficient permissions' }
        }

        // Update via API
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/clients/${clientId}/ndis-config`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': (await headers()).get('cookie') || ''
            },
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            return { success: false, error: errorData.error?.message || 'Failed to update NDIS configuration' }
        }

        return { success: true }
    } catch (error) {
        console.error('Error updating NDIS config:', error)
        return { success: false, error: 'An error occurred while updating NDIS configuration' }
    }
}
