import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { ClientRequirementsClient } from "./client"

interface PageProps {
    params: { id: string }
}

async function getClientWithRequirements(clientId: string) {
    const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
            requirements: true
        }
    })

    return client
}

export default async function ClientRequirementsPage({ params }: PageProps) {
    const client = await getClientWithRequirements(params.id)

    if (!client) {
        notFound()
    }

    const requirements = client.requirements ? {
        requiresHighIntensity: client.requirements.requiresHighIntensity,
        highIntensityTypes: client.requirements.highIntensityTypes,
        genderPreference: client.requirements.genderPreference,
        bannedWorkerIds: client.requirements.bannedWorkerIds,
        preferredWorkerIds: client.requirements.preferredWorkerIds,
        requiresBSP: client.requirements.requiresBSP,
        bspRequires2to1: client.requirements.bspRequires2to1,
        bspRequiredGender: client.requirements.bspRequiredGender,
        bspRequiresPBS: client.requirements.bspRequiresPBS,
        requiresTransfers: client.requirements.requiresTransfers,
        riskLevel: client.requirements.riskLevel
    } : null

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Client Support Requirements</h1>
                <p className="text-muted-foreground">
                    Configure support needs and preferences for {client.name}
                </p>
            </div>

            <ClientRequirementsClient
                clientId={client.id}
                clientName={client.name}
                initialRequirements={requirements}
            />
        </div>
    )
}
