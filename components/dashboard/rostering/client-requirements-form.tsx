"use client"

import { useState } from "react"
import { RiskLevel } from "@/generated/prisma/client/enums"
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
import { Separator } from "@/components/ui/separator"
import { WorkerSelector } from "./worker-selector"

interface ClientRequirementsFormProps {
    clientId: string
    requirements?: {
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
    }
    onSubmit: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
    onCancel?: () => void
}

const HIGH_INTENSITY_TYPES = [
    { value: "CATHETER", label: "Catheter Care" },
    { value: "PEG", label: "PEG Feeding" },
    { value: "DIABETES", label: "Diabetes Management" },
    { value: "SEIZURE", label: "Seizure Management" },
    { value: "BEHAVIOUR", label: "Complex Behaviour Support" },
]

export function ClientRequirementsForm({
    clientId,
    requirements,
    onSubmit,
    onCancel
}: ClientRequirementsFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [requiresHighIntensity, setRequiresHighIntensity] = useState(requirements?.requiresHighIntensity || false)
    const [requiresBSP, setRequiresBSP] = useState(requirements?.requiresBSP || false)
    const [bannedWorkerIds, setBannedWorkerIds] = useState<string[]>(requirements?.bannedWorkerIds || [])
    const [preferredWorkerIds, setPreferredWorkerIds] = useState<string[]>(requirements?.preferredWorkerIds || [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const result = await onSubmit(formData)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else if (onCancel) {
            onCancel()
        } else {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Client Support Requirements</CardTitle>
                <CardDescription>
                    Configure support needs, preferences, and safety requirements
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    {/* Risk Level */}
                    <div className="space-y-2">
                        <Label htmlFor="riskLevel">Risk Level</Label>
                        <Select name="riskLevel" defaultValue={requirements?.riskLevel || RiskLevel.LOW} required>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={RiskLevel.LOW}>Low</SelectItem>
                                <SelectItem value={RiskLevel.MEDIUM}>Medium</SelectItem>
                                <SelectItem value={RiskLevel.HIGH}>High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    {/* High-Intensity Support */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="requiresHighIntensity"
                                name="requiresHighIntensity"
                                checked={requiresHighIntensity}
                                onCheckedChange={(checked) => setRequiresHighIntensity(!!checked)}
                                value="true"
                            />
                            <Label htmlFor="requiresHighIntensity" className="font-semibold cursor-pointer">
                                Requires High-Intensity Support
                            </Label>
                        </div>

                        {requiresHighIntensity && (
                            <div className="ml-6 space-y-2">
                                <Label>High-Intensity Types</Label>
                                {HIGH_INTENSITY_TYPES.map((type) => (
                                    <div key={type.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`hi-${type.value}`}
                                            name="highIntensityTypes"
                                            value={type.value}
                                            defaultChecked={requirements?.highIntensityTypes.includes(type.value)}
                                        />
                                        <Label htmlFor={`hi-${type.value}`} className="font-normal cursor-pointer">
                                            {type.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Manual Handling */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="requiresTransfers"
                            name="requiresTransfers"
                            defaultChecked={requirements?.requiresTransfers}
                            value="true"
                        />
                        <Label htmlFor="requiresTransfers" className="font-normal cursor-pointer">
                            Requires Manual Handling / Transfers
                        </Label>
                    </div>

                    <Separator />

                    {/* Gender Preference */}
                    <div className="space-y-2">
                        <Label htmlFor="genderPreference">Gender Preference</Label>
                        <Select name="genderPreference" defaultValue={requirements?.genderPreference || "ANY"}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ANY">No Preference</SelectItem>
                                <SelectItem value="MALE">Male Workers Only</SelectItem>
                                <SelectItem value="FEMALE">Female Workers Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    {/* Banned Workers */}
                    <WorkerSelector
                        label="Banned Workers"
                        description="Workers who should not be assigned to this client"
                        selectedWorkerIds={bannedWorkerIds}
                        onChange={setBannedWorkerIds}
                        variant="banned"
                    />

                    <Separator />

                    {/* Preferred Workers */}
                    <WorkerSelector
                        label="Preferred Workers"
                        description="Workers preferred for this client (for continuity of care)"
                        selectedWorkerIds={preferredWorkerIds}
                        onChange={setPreferredWorkerIds}
                        variant="preferred"
                    />

                    <Separator />

                    {/* Behaviour Support Plan */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="requiresBSP"
                                name="requiresBSP"
                                checked={requiresBSP}
                                onCheckedChange={(checked) => setRequiresBSP(!!checked)}
                                value="true"
                            />
                            <Label htmlFor="requiresBSP" className="font-semibold cursor-pointer">
                                Has Behaviour Support Plan (BSP)
                            </Label>
                        </div>

                        {requiresBSP && (
                            <div className="ml-6 space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="bspRequires2to1"
                                        name="bspRequires2to1"
                                        defaultChecked={requirements?.bspRequires2to1}
                                        value="true"
                                    />
                                    <Label htmlFor="bspRequires2to1" className="font-normal cursor-pointer">
                                        Requires 2-to-1 Support
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="bspRequiresPBS"
                                        name="bspRequiresPBS"
                                        defaultChecked={requirements?.bspRequiresPBS}
                                        value="true"
                                    />
                                    <Label htmlFor="bspRequiresPBS" className="font-normal cursor-pointer">
                                        Requires PBS Training
                                    </Label>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bspRequiredGender">BSP Required Gender</Label>
                                    <Select name="bspRequiredGender" defaultValue={requirements?.bspRequiredGender || "ANY"}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ANY">No Requirement</SelectItem>
                                            <SelectItem value="MALE">Male Required</SelectItem>
                                            <SelectItem value="FEMALE">Female Required</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : requirements ? "Update Requirements" : "Create Requirements"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
