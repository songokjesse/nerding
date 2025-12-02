"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { WorkerCredentialsList } from "@/components/dashboard/rostering/worker-credentials-list"
import { CredentialForm } from "@/components/dashboard/rostering/credential-form"
import { createCredential, updateCredential, deleteCredential } from "./actions"
import { CredentialType } from "@/generated/prisma/client/enums"

interface Credential {
    id: string
    type: CredentialType
    issueDate: string
    expiryDate?: string | null
    documentUrl?: string | null
    verified: boolean
}

interface WorkerCredentialsClientProps {
    workerId: string
    workerName: string
    initialCredentials: Credential[]
}

export function WorkerCredentialsClient({
    workerId,
    workerName,
    initialCredentials
}: WorkerCredentialsClientProps) {
    const [showForm, setShowForm] = useState(false)
    const [editingCredential, setEditingCredential] = useState<Credential | null>(null)

    const handleEdit = (credential: Credential) => {
        setEditingCredential(credential)
        setShowForm(true)
    }

    const handleCancel = () => {
        setShowForm(false)
        setEditingCredential(null)
    }

    const handleSubmit = async (formData: FormData) => {
        if (editingCredential) {
            return await updateCredential(workerId, editingCredential.id, formData)
        } else {
            return await createCredential(workerId, formData)
        }
    }

    const handleDelete = async (credentialId: string) => {
        return await deleteCredential(workerId, credentialId)
    }

    return (
        <div className="space-y-6">
            {!showForm && (
                <div className="flex justify-end">
                    <Button onClick={() => setShowForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Credential
                    </Button>
                </div>
            )}

            {showForm ? (
                <CredentialForm
                    workerId={workerId}
                    credential={editingCredential || undefined}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                />
            ) : (
                <WorkerCredentialsList
                    credentials={initialCredentials}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}
        </div>
    )
}
