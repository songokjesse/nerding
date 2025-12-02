"use client"

import { RiskLevel } from "@/generated/prisma/client/enums"
import { ClientRequirementsForm } from "@/components/dashboard/rostering/client-requirements-form"
import { createRequirements, updateRequirements } from "./actions"

interface ClientRequirementsClientProps {
    clientId: string
    clientName: string
    initialRequirements: {
        requiresHighIntensity: boolean
        highIntensityTypes: string[]
        genderPreference?: string | null
        bannedWorkerIds: string[]
        preferredWorkerIds: string[]
        requiresBSP: boolean
        bspRequires2to1: boolean
        bspRequiredGender?: string | null
        bspRequiresPBS: boolean
        requiresTransfers: boolean
        riskLevel: RiskLevel
    } | null
}

export function ClientRequirementsClient({
    clientId,
    clientName,
    initialRequirements
}: ClientRequirementsClientProps) {
    const handleSubmit = async (formData: FormData) => {
        if (initialRequirements) {
            return await updateRequirements(clientId, formData)
        } else {
            return await createRequirements(clientId, formData)
        }
    }

    return (
        <ClientRequirementsForm
            clientId={clientId}
            requirements={initialRequirements || undefined}
            onSubmit={handleSubmit}
        />
    )
}
