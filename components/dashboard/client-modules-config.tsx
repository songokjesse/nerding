"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModuleType } from "@/generated/prisma/client/enums"
import { toggleClientModule } from "@/app/dashboard/clients/modules"
import { Activity, Droplets, Eye, Brain } from "lucide-react"

interface ClientModuleConfigProps {
    clientId: string
    modules: {
        moduleType: ModuleType
        isEnabled: boolean
    }[]
    canEdit: boolean
}

const moduleDetails = {
    [ModuleType.BOWEL_MONITORING]: {
        label: "Bowel Monitoring",
        description: "Track bowel movements, consistency, and concerns.",
        icon: Activity
    },
    [ModuleType.FLUID_INTAKE]: {
        label: "Fluid Intake",
        description: "Monitor daily fluid consumption.",
        icon: Droplets
    },
    [ModuleType.BEHAVIOUR_OBSERVATION]: {
        label: "Behaviour Observation",
        description: "Record behavioural incidents and observations.",
        icon: Eye
    },
    [ModuleType.SEIZURE_MONITORING]: {
        label: "Seizure Monitoring",
        description: "Log seizure activity and duration.",
        icon: Brain
    }
}

export function ClientModuleConfig({ clientId, modules, canEdit }: ClientModuleConfigProps) {
    const [loading, setLoading] = useState<string | null>(null)

    const handleToggle = async (type: ModuleType, currentState: boolean) => {
        if (!canEdit) return
        setLoading(type)
        try {
            await toggleClientModule(clientId, type, !currentState)
        } catch (error) {
            console.error("Failed to toggle module", error)
        } finally {
            setLoading(null)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Clinical Modules</CardTitle>
                <CardDescription>Enable or disable monitoring modules for this client.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {Object.values(ModuleType).map((type) => {
                    const module = modules.find((m) => m.moduleType === type)
                    const isEnabled = module?.isEnabled || false
                    const details = moduleDetails[type]

                    return (
                        <div key={type} className="flex items-center justify-between space-x-4">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-muted rounded-full">
                                    <details.icon className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <Label htmlFor={`module-${type}`} className="text-base font-medium">
                                        {details.label}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {details.description}
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id={`module-${type}`}
                                checked={isEnabled}
                                onCheckedChange={() => handleToggle(type, isEnabled)}
                                disabled={!canEdit || loading === type}
                            />
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
