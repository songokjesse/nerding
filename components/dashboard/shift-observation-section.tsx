"use client"

import { BowelMonitoringCard } from "@/components/dashboard/modules/bowel-monitoring-card"
import { FluidIntakeCard } from "@/components/dashboard/modules/fluid-intake-card"
import { SeizureMonitoringCard } from "@/components/dashboard/modules/seizure-monitoring-card"
import { BehaviourObservationCard } from "@/components/dashboard/modules/behaviour-observation-card"
import { BGLMonitoringCard } from "@/components/dashboard/modules/bgl-monitoring-card"
import { saveObservation } from "@/app/dashboard/shifts/actions"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import { Label } from "@/components/ui/label"

interface ShiftObservationSectionProps {
    shiftId: string
    clients?: { id: string, name: string | null }[]
    defaultClientId?: string | null
    bowelMonitoringEnabled: boolean
    fluidIntakeEnabled: boolean
    seizureMonitoringEnabled: boolean
    behaviourObservationEnabled: boolean
    bglMonitoringEnabled: boolean
}

export function ShiftObservationSection({
    shiftId,
    clients,
    defaultClientId,
    bowelMonitoringEnabled,
    fluidIntakeEnabled,
    seizureMonitoringEnabled,
    behaviourObservationEnabled,
    bglMonitoringEnabled
}: ShiftObservationSectionProps) {
    const [selectedClientId, setSelectedClientId] = useState<string>(defaultClientId || "")

    const handleSaveObservation = async (data: any) => {
        if (!selectedClientId && !defaultClientId) {
            // Should ideally show an error or disable the save button
            alert("Please select a resident first")
            return
        }
        try {
            await saveObservation(shiftId, data, selectedClientId || defaultClientId || undefined)
        } catch (error) {
            console.error("Failed to save observation", error)
            throw error // Re-throw so the card can handle it
        }
    }

    // If no modules are enabled, don't render anything
    const hasEnabledModules = bowelMonitoringEnabled || fluidIntakeEnabled || seizureMonitoringEnabled || behaviourObservationEnabled || bglMonitoringEnabled
    if (!hasEnabledModules) return null

    return (
        <div className="space-y-6">
            {clients && clients.length > 0 && (
                <div className="bg-muted/50 p-4 rounded-lg border">
                    <Label htmlFor="resident-select" className="mb-2 block">Select Resident for Observation</Label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                        <SelectTrigger id="resident-select" className="w-full md:w-[300px] bg-background">
                            <SelectValue placeholder="Select a resident..." />
                        </SelectTrigger>
                        <SelectContent>
                            {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                    {client.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            {bowelMonitoringEnabled && (
                <BowelMonitoringCard onSave={handleSaveObservation} />
            )}
            {fluidIntakeEnabled && (
                <FluidIntakeCard onSave={handleSaveObservation} />
            )}
            {seizureMonitoringEnabled && (
                <SeizureMonitoringCard onSave={handleSaveObservation} />
            )}
            {behaviourObservationEnabled && (
                <BehaviourObservationCard onSave={handleSaveObservation} />
            )}
            {bglMonitoringEnabled && (
                <BGLMonitoringCard onSave={handleSaveObservation} />
            )}
        </div>
    )
}
