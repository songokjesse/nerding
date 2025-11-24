"use client"

import { useState } from "react"
import { BowelMonitoringCard } from "@/components/dashboard/modules/bowel-monitoring-card"
import { saveObservation } from "@/app/dashboard/shifts/actions"

interface ShiftObservationSectionProps {
    shiftId: string
    bowelMonitoringEnabled: boolean
}

export function ShiftObservationSection({ shiftId, bowelMonitoringEnabled }: ShiftObservationSectionProps) {
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

    if (!bowelMonitoringEnabled) return null

    return (
        <div className="space-y-6">
            <BowelMonitoringCard onSave={handleSaveObservation} isSaving={isSaving} />
        </div>
    )
}
