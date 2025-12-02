"use client"

import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ShiftValidationIndicatorProps {
    status: 'valid' | 'warning' | 'blocked' | 'pending'
    violationCount?: number
    warningCount?: number
}

export function ShiftValidationIndicator({
    status,
    violationCount = 0,
    warningCount = 0
}: ShiftValidationIndicatorProps) {
    const config = {
        valid: {
            icon: CheckCircle2,
            label: 'Valid',
            color: 'bg-green-600',
            textColor: 'text-green-600',
            tooltip: 'All validation checks passed'
        },
        warning: {
            icon: AlertTriangle,
            label: 'Warnings',
            color: 'bg-yellow-600',
            textColor: 'text-yellow-600',
            tooltip: `${warningCount} warning${warningCount !== 1 ? 's' : ''} - can be overridden`
        },
        blocked: {
            icon: AlertCircle,
            label: 'Blocked',
            color: 'bg-red-600',
            textColor: 'text-red-600',
            tooltip: `${violationCount} violation${violationCount !== 1 ? 's' : ''} - cannot proceed`
        },
        pending: {
            icon: AlertCircle,
            label: 'Pending',
            color: 'bg-gray-400',
            textColor: 'text-gray-600',
            tooltip: 'Validation not yet performed'
        }
    }

    const { icon: Icon, label, color, textColor, tooltip } = config[status]

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant="outline" className={`flex items-center gap-1.5 cursor-help ${textColor}`}>
                        <Icon className="h-3.5 w-3.5" />
                        <span>{label}</span>
                        {(violationCount > 0 || warningCount > 0) && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-current text-white">
                                {violationCount || warningCount}
                            </span>
                        )}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
