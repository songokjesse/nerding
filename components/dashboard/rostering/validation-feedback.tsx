"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react"

interface RuleViolation {
    ruleId: string
    severity: 'HARD' | 'SOFT'
    category: string
    message: string
    affectedEntity?: string
    suggestedResolution?: string
    details?: any
}

interface ValidationFeedbackProps {
    violations: RuleViolation[]
    warnings: RuleViolation[]
    canOverride?: boolean
    onOverride?: () => void
    isOverriding?: boolean
}

export function ValidationFeedback({
    violations,
    warnings,
    canOverride = false,
    onOverride,
    isOverriding = false
}: ValidationFeedbackProps) {
    const groupByCategory = (items: RuleViolation[]) => {
        const grouped = new Map<string, RuleViolation[]>()
        items.forEach(item => {
            if (!grouped.has(item.category)) {
                grouped.set(item.category, [])
            }
            grouped.get(item.category)!.push(item)
        })
        return grouped
    }

    const formatCategory = (category: string) => {
        return category.replace(/_/g, ' ').split(' ')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ')
    }

    const groupedViolations = groupByCategory(violations)
    const groupedWarnings = groupByCategory(warnings)

    if (violations.length === 0 && warnings.length === 0) {
        return (
            <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900">All Checks Passed</AlertTitle>
                <AlertDescription className="text-green-700">
                    This shift assignment meets all rostering rules and compliance requirements.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="space-y-4">
            {/* Hard Constraint Violations */}
            {violations.length > 0 && (
                <Card className="border-red-200">
                    <CardHeader className="bg-red-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <CardTitle className="text-red-900">
                                    {violations.length} Violation{violations.length !== 1 ? 's' : ''}
                                </CardTitle>
                            </div>
                            {canOverride && onOverride && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onOverride}
                                    disabled={isOverriding}
                                    className="border-red-300 text-red-700 hover:bg-red-100"
                                >
                                    {isOverriding ? "Overriding..." : "Override with Approval"}
                                </Button>
                            )}
                        </div>
                        <CardDescription className="text-red-700">
                            These violations must be resolved before proceeding
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            {Array.from(groupedViolations.entries()).map(([category, items]) => (
                                <div key={category}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <ShieldAlert className="h-4 w-4 text-red-600" />
                                        <h4 className="font-semibold text-sm text-red-900">
                                            {formatCategory(category)}
                                        </h4>
                                        <Badge variant="destructive" className="ml-auto">
                                            {items.length}
                                        </Badge>
                                    </div>
                                    <div className="space-y-3 ml-6">
                                        {items.map((violation, idx) => (
                                            <div key={`${violation.ruleId}-${idx}`} className="space-y-1">
                                                <p className="text-sm text-gray-900">{violation.message}</p>
                                                {violation.suggestedResolution && (
                                                    <p className="text-sm text-gray-600 flex items-start gap-1.5">
                                                        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                                        <span>{violation.suggestedResolution}</span>
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {Array.from(groupedViolations.keys()).indexOf(category) < groupedViolations.size - 1 && (
                                        <Separator className="mt-4" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Soft Constraint Warnings */}
            {warnings.length > 0 && (
                <Card className="border-yellow-200">
                    <CardHeader className="bg-yellow-50">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <CardTitle className="text-yellow-900">
                                {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
                            </CardTitle>
                        </div>
                        <CardDescription className="text-yellow-700">
                            These warnings can be overridden but should be reviewed
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            {Array.from(groupedWarnings.entries()).map(([category, items]) => (
                                <div key={category}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Info className="h-4 w-4 text-yellow-600" />
                                        <h4 className="font-semibold text-sm text-yellow-900">
                                            {formatCategory(category)}
                                        </h4>
                                        <Badge variant="outline" className="ml-auto border-yellow-300 text-yellow-700">
                                            {items.length}
                                        </Badge>
                                    </div>
                                    <div className="space-y-3 ml-6">
                                        {items.map((warning, idx) => (
                                            <div key={`${warning.ruleId}-${idx}`} className="space-y-1">
                                                <p className="text-sm text-gray-900">{warning.message}</p>
                                                {warning.suggestedResolution && (
                                                    <p className="text-sm text-gray-600 flex items-start gap-1.5">
                                                        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                                        <span>{warning.suggestedResolution}</span>
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {Array.from(groupedWarnings.keys()).indexOf(category) < groupedWarnings.size - 1 && (
                                        <Separator className="mt-4" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
