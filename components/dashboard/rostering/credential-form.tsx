"use client"

import { useState } from "react"
import { CredentialType } from "@/generated/prisma/client/enums"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CredentialFormProps {
    workerId: string
    credential?: {
        id: string
        type: CredentialType
        issueDate: string
        expiryDate?: string | null
        documentUrl?: string | null
        verified: boolean
    }
    onSubmit: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
    onCancel: () => void
}

const CREDENTIAL_TYPES = [
    { value: CredentialType.NDIS_WORKER_SCREENING, label: "NDIS Worker Screening" },
    { value: CredentialType.WORKING_WITH_CHILDREN, label: "Working with Children Check" },
    { value: CredentialType.FIRST_AID_CPR, label: "First Aid / CPR" },
    { value: CredentialType.MANUAL_HANDLING, label: "Manual Handling" },
    { value: CredentialType.MEDICATION_COMPETENCY, label: "Medication Competency" },
    { value: CredentialType.HIGH_INTENSITY_CATHETER, label: "High Intensity - Catheter" },
    { value: CredentialType.HIGH_INTENSITY_PEG, label: "High Intensity - PEG" },
    { value: CredentialType.HIGH_INTENSITY_DIABETES, label: "High Intensity - Diabetes" },
    { value: CredentialType.HIGH_INTENSITY_SEIZURE, label: "High Intensity - Seizure" },
    { value: CredentialType.HIGH_INTENSITY_BEHAVIOUR, label: "High Intensity - Behaviour" },
    { value: CredentialType.DRIVERS_LICENCE, label: "Driver's Licence" },
    { value: CredentialType.VEHICLE_INSURANCE, label: "Vehicle Insurance" },
    { value: CredentialType.PBS_TRAINING, label: "PBS Training" },
]

export function CredentialForm({ workerId, credential, onSubmit, onCancel }: CredentialFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const result = await onSubmit(formData)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            onCancel() // Close form on success
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{credential ? "Edit Credential" : "Add New Credential"}</CardTitle>
                <CardDescription>
                    {credential ? "Update credential details" : "Add a new credential for this worker"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="type">Credential Type</Label>
                        <Select
                            name="type"
                            defaultValue={credential?.type}
                            disabled={!!credential} // Can't change type after creation
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select credential type" />
                            </SelectTrigger>
                            <SelectContent>
                                {CREDENTIAL_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="issueDate">Issue Date</Label>
                            <Input
                                type="date"
                                id="issueDate"
                                name="issueDate"
                                defaultValue={credential?.issueDate?.split('T')[0]}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                            <Input
                                type="date"
                                id="expiryDate"
                                name="expiryDate"
                                defaultValue={credential?.expiryDate?.split('T')[0]}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="documentUrl">Document URL (Optional)</Label>
                        <Input
                            type="url"
                            id="documentUrl"
                            name="documentUrl"
                            placeholder="https://..."
                            defaultValue={credential?.documentUrl || ''}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="verified"
                            name="verified"
                            defaultChecked={credential?.verified}
                            value="true"
                        />
                        <Label htmlFor="verified" className="font-normal cursor-pointer">
                            Credential has been verified
                        </Label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : credential ? "Update" : "Add Credential"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
