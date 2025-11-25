"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Activity, Droplets, Brain, Eye } from "lucide-react"
import { ModuleType } from "@/generated/prisma/client/enums"

interface Observation {
    id: string
    type: ModuleType
    data: any
    recordedAt: string
}

interface ObservationDisplayProps {
    observations: Observation[]
}

const observationConfig = {
    [ModuleType.BOWEL_MONITORING]: {
        icon: Activity,
        color: "purple",
        label: "Bowel Monitoring",
        bgClass: "bg-purple-50 dark:bg-purple-900/20",
        borderClass: "border-purple-200 dark:border-purple-800",
        iconClass: "text-purple-600 dark:text-purple-400",
        textClass: "text-purple-900 dark:text-purple-100"
    },
    [ModuleType.FLUID_INTAKE]: {
        icon: Droplets,
        color: "blue",
        label: "Fluid Intake",
        bgClass: "bg-blue-50 dark:bg-blue-900/20",
        borderClass: "border-blue-200 dark:border-blue-800",
        iconClass: "text-blue-600 dark:text-blue-400",
        textClass: "text-blue-900 dark:text-blue-100"
    },
    [ModuleType.SEIZURE_MONITORING]: {
        icon: Brain,
        color: "red",
        label: "Seizure Monitoring",
        bgClass: "bg-red-50 dark:bg-red-900/20",
        borderClass: "border-red-200 dark:border-red-800",
        iconClass: "text-red-600 dark:text-red-400",
        textClass: "text-red-900 dark:text-red-100"
    },
    [ModuleType.BEHAVIOUR_OBSERVATION]: {
        icon: Eye,
        color: "orange",
        label: "Behaviour Observation",
        bgClass: "bg-orange-50 dark:bg-orange-900/20",
        borderClass: "border-orange-200 dark:border-orange-800",
        iconClass: "text-orange-600 dark:text-orange-400",
        textClass: "text-orange-900 dark:text-orange-100"
    }
}

function formatObservationData(type: ModuleType, data: any) {
    switch (type) {
        case ModuleType.BOWEL_MONITORING:
            return (
                <div className="grid grid-cols-2 gap-2 text-sm">
                    {data.type && <div><span className="font-medium">Bristol Type:</span> {data.type}</div>}
                    {data.consistency && <div><span className="font-medium">Consistency:</span> {data.consistency}</div>}
                    {data.color && <div><span className="font-medium">Color:</span> {data.color}</div>}
                    {data.concerns && <div className="col-span-2"><span className="font-medium">Concerns:</span> {data.concerns}</div>}
                </div>
            )

        case ModuleType.FLUID_INTAKE:
            return (
                <div className="grid grid-cols-2 gap-2 text-sm">
                    {data.fluidType && <div><span className="font-medium">Type:</span> {data.fluidType}</div>}
                    {data.amount && <div><span className="font-medium">Amount:</span> {data.amount}ml</div>}
                    {data.notes && <div className="col-span-2"><span className="font-medium">Notes:</span> {data.notes}</div>}
                </div>
            )

        case ModuleType.SEIZURE_MONITORING:
            return (
                <div className="grid grid-cols-2 gap-2 text-sm">
                    {data.seizureType && <div><span className="font-medium">Type:</span> {data.seizureType}</div>}
                    {data.duration && <div><span className="font-medium">Duration:</span> {data.duration} min</div>}
                    {data.severity && <div><span className="font-medium">Severity:</span> {data.severity}</div>}
                    {data.postIctalState && <div className="col-span-2"><span className="font-medium">Post-Ictal State:</span> {data.postIctalState}</div>}
                    {data.notes && <div className="col-span-2"><span className="font-medium">Notes:</span> {data.notes}</div>}
                </div>
            )

        case ModuleType.BEHAVIOUR_OBSERVATION:
            return (
                <div className="grid grid-cols-2 gap-2 text-sm">
                    {data.behaviourType && <div><span className="font-medium">Type:</span> {data.behaviourType}</div>}
                    {data.severity && <div><span className="font-medium">Severity:</span> {data.severity}</div>}
                    {data.triggers && <div className="col-span-2"><span className="font-medium">Triggers:</span> {data.triggers}</div>}
                    {data.intervention && <div className="col-span-2"><span className="font-medium">Intervention:</span> {data.intervention}</div>}
                    {data.outcome && <div className="col-span-2"><span className="font-medium">Outcome:</span> {data.outcome}</div>}
                    {data.notes && <div className="col-span-2"><span className="font-medium">Notes:</span> {data.notes}</div>}
                </div>
            )

        default:
            return <div className="text-sm">Unknown observation type</div>
    }
}

export function ObservationDisplay({ observations }: ObservationDisplayProps) {
    if (observations.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No clinical observations recorded yet</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {observations.map((obs) => {
                const config = observationConfig[obs.type]
                if (!config) return null

                const Icon = config.icon

                return (
                    <div
                        key={obs.id}
                        className={`p-4 rounded-lg border ${config.bgClass} ${config.borderClass}`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Icon className={`h-5 w-5 ${config.iconClass}`} />
                                <span className={`font-semibold ${config.textClass}`}>
                                    {config.label}
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {new Date(obs.recordedAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        <div className={config.textClass}>
                            {formatObservationData(obs.type, obs.data)}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
