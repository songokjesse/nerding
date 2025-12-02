"use server"

import { revalidatePath } from 'next/cache'

/**
 * Server actions for client requirements management
 */

export async function createRequirements(clientId: string, formData: FormData) {
    try {
        const data = {
            requiresHighIntensity: formData.get('requiresHighIntensity') === 'true',
            highIntensityTypes: formData.getAll('highIntensityTypes'),
            genderPreference: formData.get('genderPreference') as string || null,
            bannedWorkerIds: formData.getAll('bannedWorkerIds'),
            preferredWorkerIds: formData.getAll('preferredWorkerIds'),
            requiresBSP: formData.get('requiresBSP') === 'true',
            bspRequires2to1: formData.get('bspRequires2to1') === 'true',
            bspRequiredGender: formData.get('bspRequiredGender') as string || null,
            bspRequiresPBS: formData.get('bspRequiresPBS') === 'true',
            requiresTransfers: formData.get('requiresTransfers') === 'true',
            riskLevel: formData.get('riskLevel') as string
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/rostering/clients/${clientId}/requirements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            const error = await response.json()
            return { error: error.error?.message || 'Failed to create requirements' }
        }

        revalidatePath(`/dashboard/rostering/clients/${clientId}/requirements`)
        return { success: true }
    } catch (error) {
        console.error('Error creating requirements:', error)
        return { error: 'Failed to create requirements' }
    }
}

export async function updateRequirements(clientId: string, formData: FormData) {
    try {
        const data = {
            requiresHighIntensity: formData.get('requiresHighIntensity') === 'true',
            highIntensityTypes: formData.getAll('highIntensityTypes'),
            genderPreference: formData.get('genderPreference') as string || null,
            bannedWorkerIds: formData.getAll('bannedWorkerIds'),
            preferredWorkerIds: formData.getAll('preferredWorkerIds'),
            requiresBSP: formData.get('requiresBSP') === 'true',
            bspRequires2to1: formData.get('bspRequires2to1') === 'true',
            bspRequiredGender: formData.get('bspRequiredGender') as string || null,
            bspRequiresPBS: formData.get('bspRequiresPBS') === 'true',
            requiresTransfers: formData.get('requiresTransfers') === 'true',
            riskLevel: formData.get('riskLevel') as string
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/rostering/clients/${clientId}/requirements`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            const error = await response.json()
            return { error: error.error?.message || 'Failed to update requirements' }
        }

        revalidatePath(`/dashboard/rostering/clients/${clientId}/requirements`)
        return { success: true }
    } catch (error) {
        console.error('Error updating requirements:', error)
        return { error: 'Failed to update requirements' }
    }
}

export async function deleteRequirements(clientId: string) {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/rostering/clients/${clientId}/requirements`,
            { method: 'DELETE' }
        )

        if (!response.ok) {
            const error = await response.json()
            return { error: error.error?.message || 'Failed to delete requirements' }
        }

        revalidatePath(`/dashboard/rostering/clients/${clientId}/requirements`)
        return { success: true }
    } catch (error) {
        console.error('Error deleting requirements:', error)
        return { error: 'Failed to delete requirements' }
    }
}
