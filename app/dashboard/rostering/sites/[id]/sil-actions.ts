'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'

export interface SILConfigData {
    isSILHouse?: boolean
    houseType?: string
    capacity?: number
    minStaffRatio?: number
    requires24_7Coverage?: boolean
    requiresOvernightStaff?: boolean
    minActiveHoursPerDay?: number
    maxSleepoverHoursPerDay?: number
    allowsSleepoverShifts?: boolean
    totalResidents?: number
    maxResidentsPerWorker?: number
    requiresMaleStaff?: boolean
    requiresFemaleStaff?: boolean
    preferredGenderMix?: string
    prefersConsistentStaff?: boolean
    maxNewStaffPerWeek?: number
    minShiftsBeforeAlone?: number
    requiresOnCallBackup?: boolean
    requiresEmergencyContact?: boolean
}

export interface SILConfigResponse {
    siteId: string
    siteName: string
    silConfig: {
        isSILHouse: boolean
        houseType: string | null
        capacity: number | null
        minStaffRatio: number | null
        requires24_7Coverage: boolean
        requiresOvernightStaff: boolean
        minActiveHoursPerDay: number | null
        maxSleepoverHoursPerDay: number | null
        allowsSleepoverShifts: boolean
        totalResidents: number | null
        maxResidentsPerWorker: number | null
        requiresMaleStaff: boolean
        requiresFemaleStaff: boolean
        preferredGenderMix: string | null
        prefersConsistentStaff: boolean
        maxNewStaffPerWeek: number | null
        minShiftsBeforeAlone: number | null
        requiresOnCallBackup: boolean
        requiresEmergencyContact: boolean
    }
}

/**
 * Get SIL configuration for a site
 */
export async function getSILConfig(siteId: string): Promise<{ config: SILConfigResponse | null; error?: string }> {
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/sites/${siteId}/sil-config`, {
            headers: {
                'Cookie': (await headers()).get('cookie') || ''
            }
        })

        if (!response.ok) {
            if (response.status === 404) {
                return { config: null, error: 'Site not found' }
            }
            return { config: null, error: 'Failed to fetch SIL configuration' }
        }

        const data = await response.json()
        return { config: data }
    } catch (error) {
        console.error('Error fetching SIL config:', error)
        return { config: null, error: 'An error occurred while fetching SIL configuration' }
    }
}

/**
 * Update SIL configuration for a site
 */
export async function updateSILConfig(
    siteId: string,
    data: SILConfigData
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/sites/${siteId}/sil-config`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': (await headers()).get('cookie') || ''
            },
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            return { success: false, error: errorData.error?.message || 'Failed to update SIL configuration' }
        }

        return { success: true }
    } catch (error) {
        console.error('Error updating SIL config:', error)
        return { success: false, error: 'An error occurred while updating SIL configuration' }
    }
}
