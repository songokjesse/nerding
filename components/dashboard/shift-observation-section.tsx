"use client"

import { useState } from "react"
import { BowelMonitoringCard } from "@/components/dashboard/modules/bowel-monitoring-card"
import { FluidIntakeCard } from "@/components/dashboard/modules/fluid-intake-card"
import { SeizureMonitoringCard } from "@/components/dashboard/modules/seizure-monitoring-card"
import { BehaviourObservationCard } from "@/components/dashboard/modules/behaviour-observation-card"
import { saveObservation } from "@/app/dashboard/shifts/actions"

interface ShiftObservationSectionProps {
    shiftId: string
    bowelMonitoringEnabled: boolean
    fluidIntakeEnabled: boolean
    seizureMonitoringEnabled: boolean
    behaviourObservationEnabled: boolean
}

export function ShiftObservationSection({
    shiftId,
    bowelMonitoringEnabled,
    fluidIntakeEnabled,
    seizureMonitoringEnabled,
    behaviourObservationEnabled
}: ShiftObservationSectionProps) {
    const [isSaving, setIsSaving] = useState(false)

    const handleSaveObservation = async (data: any) => {
        setIsSaving(true)
        try {
            await saveObservation(shiftId, data)
        } catch (error) {
            console.error("Failed to save observation", error)
        } finally {
            setIsSaving(false)
        }
    }

    // If no modules are enabled, don't render anything
    const hasEnabledModules = bowelMonitoringEnabled || fluidIntakeEnabled || seizureMonitoringEnabled || behaviourObservationEnabled
    if (!hasEnabledModules) return null

    return (
        <div className="space-y-6">
            {bowelMonitoringEnabled && (
                <BowelMonitoringCard onSave={handleSaveObservation} isSaving={isSaving} />
            )}
            {fluidIntakeEnabled && (
                <FluidIntakeCard onSave={handleSaveObservation} isSaving={isSaving} />
            )}
            {seizureMonitoringEnabled && (
                <SeizureMonitoringCard onSave={handleSaveObservation} isSaving={isSaving} />
            )}
            {behaviourObservationEnabled && (
                <BehaviourObservationCard onSave={handleSaveObservation} isSaving={isSaving} />
            )}
        </div>
    )
}
