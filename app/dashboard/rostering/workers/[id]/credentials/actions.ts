"use server"

import { revalidatePath } from 'next/cache'

/**
 * Server actions for worker credentials management
 */

export async function createCredential(workerId: string, formData: FormData) {
    try {
        const type = formData.get('type') as string
        const issueDate = formData.get('issueDate') as string
        const expiryDate = formData.get('expiryDate') as string
        const documentUrl = formData.get('documentUrl') as string
        const verified = formData.get('verified') === 'true'

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/rostering/workers/${workerId}/credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                issueDate,
                expiryDate: expiryDate || null,
                documentUrl: documentUrl || null,
                verified
            })
        })

        if (!response.ok) {
            const error = await response.json()
            return { error: error.error?.message || 'Failed to create credential' }
        }

        revalidatePath(`/dashboard/rostering/workers/${workerId}/credentials`)
        return { success: true }
    } catch (error) {
        console.error('Error creating credential:', error)
        return { error: 'Failed to create credential' }
    }
}

export async function updateCredential(workerId: string, credentialId: string, formData: FormData) {
    try {
        const issueDate = formData.get('issueDate') as string
        const expiryDate = formData.get('expiryDate') as string
        const documentUrl = formData.get('documentUrl') as string
        const verified = formData.get('verified') === 'true'

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/rostering/workers/${workerId}/credentials`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                credentialId,
                issueDate,
                expiryDate: expiryDate || null,
                documentUrl: documentUrl || null,
                verified
            })
        })

        if (!response.ok) {
            const error = await response.json()
            return { error: error.error?.message || 'Failed to update credential' }
        }

        revalidatePath(`/dashboard/rostering/workers/${workerId}/credentials`)
        return { success: true }
    } catch (error) {
        console.error('Error updating credential:', error)
        return { error: 'Failed to update credential' }
    }
}

export async function deleteCredential(workerId: string, credentialId: string) {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/rostering/workers/${workerId}/credentials?credentialId=${credentialId}`,
            { method: 'DELETE' }
        )

        if (!response.ok) {
            const error = await response.json()
            return { error: error.error?.message || 'Failed to delete credential' }
        }

        revalidatePath(`/dashboard/rostering/workers/${workerId}/credentials`)
        return { success: true }
    } catch (error) {
        console.error('Error deleting credential:', error)
        return { error: 'Failed to delete credential' }
    }
}
