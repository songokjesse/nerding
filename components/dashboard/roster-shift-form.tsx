"use client"

import { useState, useEffect } from "react"
import { createRosterShift } from "@/app/dashboard/shifts/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { ShiftValidationIndicator } from "./rostering/shift-validation-indicator"
import { ValidationFeedback } from "./rostering/validation-feedback"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface RosterShiftFormProps {
    clients: { id: string; name: string }[]
    workers: { id: string; name: string }[]
}

interface ValidationResult {
    valid: boolean
    canOverride: boolean
    violations: Array<{
        ruleId: string
        severity: 'HARD' | 'SOFT'
        category: string
        message: string
        suggestedResolution?: string
    }>
    warnings: Array<{
        ruleId: string
        severity: 'SOFT'
        category: string
        message: string
        suggestedResolution?: string
    }>
}

export function RosterShiftForm({ clients, workers }: RosterShiftFormProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [selectedClients, setSelectedClients] = useState<string[]>([])
    const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
    const [isValidating, setIsValidating] = useState(false)
    const [showOverrideDialog, setShowOverrideDialog] = useState(false)
    const [overrideReason, setOverrideReason] = useState("")

    // NDIS Configuration State
    const [ndisConfigOpen, setNdisConfigOpen] = useState(false)
    const [shiftType, setShiftType] = useState("")
    const [shiftCategory, setShiftCategory] = useState("")
    const [supportRatio, setSupportRatio] = useState("")
    const [isHighIntensity, setIsHighIntensity] = useState(false)
    const [requiresTransport, setRequiresTransport] = useState(false)
    const [travelDistance, setTravelDistance] = useState("")

    // Real-time validation
    useEffect(() => {
        if (selectedClients.length === 0 || selectedWorkers.length === 0 || !startTime || !endTime) {
            setValidationResult(null)
            return
        }

        const validateShift = async () => {
            setIsValidating(true)
            try {
                const response = await fetch('/api/v1/rostering/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientIds: selectedClients,
                        workerIds: selectedWorkers,
                        startTime,
                        endTime
                    })
                })

                if (response.ok) {
                    const data = await response.json()
                    setValidationResult(data)
                }
            } catch (error) {
                console.error('Validation error:', error)
            } finally {
                setIsValidating(false)
            }
        }

        const debounce = setTimeout(validateShift, 500)
        return () => clearTimeout(debounce)
    }, [selectedClients, selectedWorkers, startTime, endTime])

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        // Check for hard constraints
        if (validationResult && !validationResult.valid && !validationResult.canOverride) {
            toast({
                title: "Cannot Create Shift",
                description: "This shift violates hard constraints and cannot be created.",
                variant: "destructive"
            })
            return
        }

        // If there are soft constraints, show override dialog
        if (validationResult && validationResult.warnings.length > 0 && !overrideReason) {
            setShowOverrideDialog(true)
            return
        }

        setIsLoading(true)

        const formData = new FormData(event.currentTarget)

        // Fix timezone: Convert local datetime-local string to ISO string (UTC)
        // This ensures the server receives the correct absolute time regardless of server timezone
        if (startTime) formData.set('startTime', new Date(startTime).toISOString())
        if (endTime) formData.set('endTime', new Date(endTime).toISOString())

        if (overrideReason) {
            formData.append('overrideReason', overrideReason)
        }

        const result = await createRosterShift(null, formData)

        if (result?.error) {
            // Check if there are credential violations
            if (result.violations && Array.isArray(result.violations)) {
                const violationMessages = result.violations.map((v: any) =>
                    `${v.message}${v.suggestedResolution ? ` - ${v.suggestedResolution}` : ''}`
                ).join('\n')

                toast({
                    title: "Cannot Create Shift",
                    description: violationMessages,
                    variant: "destructive"
                })
            } else {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive"
                })
            }
        } else {
            toast({
                title: "Success",
                description: "Shift created successfully",
                variant: "success"
            })
            router.push("/dashboard/rostering/calendar")
        }
        setIsLoading(false)
    }

    const handleOverrideConfirm = () => {
        setShowOverrideDialog(false)
        // Trigger form submission
        const form = document.querySelector('form') as HTMLFormElement
        form.requestSubmit()
    }

    const hasHardViolations = !!(validationResult && !validationResult.valid && !validationResult.canOverride)
    const hasWarnings = !!(validationResult && validationResult.warnings.length > 0)

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
                <div className="space-y-2">
                    <h2 className="text-xl font-bold">Create Roster Shift</h2>
                    <p className="text-sm text-gray-500">Schedule a shift for multiple clients and workers.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                            type="datetime-local"
                            id="startTime"
                            name="startTime"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                            type="datetime-local"
                            id="endTime"
                            name="endTime"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Clients</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border p-4 rounded-md max-h-48 overflow-y-auto">
                        {clients.map(client => (
                            <div key={client.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`client-${client.id}`}
                                    name="clientIds"
                                    value={client.id}
                                    checked={selectedClients.includes(client.id)}
                                    onCheckedChange={(checked) => {
                                        setSelectedClients(prev =>
                                            checked
                                                ? [...prev, client.id]
                                                : prev.filter(id => id !== client.id)
                                        )
                                    }}
                                />
                                <Label htmlFor={`client-${client.id}`} className="cursor-pointer font-normal">
                                    {client.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Workers</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border p-4 rounded-md max-h-48 overflow-y-auto">
                        {workers.map(worker => (
                            <div key={worker.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`worker-${worker.id}`}
                                    name="workerIds"
                                    value={worker.id}
                                    checked={selectedWorkers.includes(worker.id)}
                                    onCheckedChange={(checked) => {
                                        setSelectedWorkers(prev =>
                                            checked
                                                ? [...prev, worker.id]
                                                : prev.filter(id => id !== worker.id)
                                        )
                                    }}
                                />
                                <Label htmlFor={`worker-${worker.id}`} className="cursor-pointer font-normal">
                                    {worker.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Validation Indicator */}
                {(isValidating || validationResult) && (
                    <div className="space-y-3">
                        <ShiftValidationIndicator
                            status={
                                isValidating ? 'pending' :
                                    hasHardViolations ? 'blocked' :
                                        hasWarnings ? 'warning' :
                                            'valid'
                            }
                            violationCount={validationResult?.violations.length || 0}
                            warningCount={validationResult?.warnings.length || 0}
                        />
                        {validationResult && (validationResult.violations.length > 0 || validationResult.warnings.length > 0) && (
                            <ValidationFeedback
                                violations={validationResult.violations}
                                warnings={validationResult.warnings}
                                onOverride={validationResult.canOverride ? () => setShowOverrideDialog(true) : undefined}
                            />
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="serviceType">Service Type (Optional)</Label>
                    <Input id="serviceType" name="serviceType" placeholder="e.g. Personal Care" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location">Location (Optional)</Label>
                    <Input id="location" name="location" placeholder="e.g. Client Home" />
                </div>

                {/* NDIS Configuration Section */}
                <Collapsible open={ndisConfigOpen} onOpenChange={setNdisConfigOpen} className="border rounded-lg">
                    <CollapsibleTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full flex items-center justify-between p-4 hover:bg-accent"
                        >
                            <span className="font-medium">NDIS Configuration (Optional)</span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${ndisConfigOpen ? 'rotate-180' : ''}`} />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Shift Type</Label>
                                <Select value={shiftType} onValueChange={setShiftType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STANDARD">Standard</SelectItem>
                                        <SelectItem value="WEEKEND">Weekend</SelectItem>
                                        <SelectItem value="PUBLIC_HOLIDAY">Public Holiday</SelectItem>
                                        <SelectItem value="EVENING">Evening</SelectItem>
                                        <SelectItem value="OVERNIGHT">Overnight</SelectItem>
                                        <SelectItem value="SPLIT">Split Shift</SelectItem>
                                    </SelectContent>
                                </Select>
                                <input type="hidden" name="shiftType" value={shiftType} />
                            </div>

                            <div className="space-y-2">
                                <Label>Shift Category</Label>
                                <Select value={shiftCategory} onValueChange={setShiftCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active Support</SelectItem>
                                        <SelectItem value="SLEEPOVER">Sleepover</SelectItem>
                                        <SelectItem value="OVERNIGHT">Overnight Active</SelectItem>
                                        <SelectItem value="RESPITE">Respite Care</SelectItem>
                                        <SelectItem value="TRANSPORT">Transport Only</SelectItem>
                                    </SelectContent>
                                </Select>
                                <input type="hidden" name="shiftCategory" value={shiftCategory} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Support Ratio</Label>
                            <Select value={supportRatio} onValueChange={setSupportRatio}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select ratio" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ONE_TO_ONE">1:1 - One worker per client</SelectItem>
                                    <SelectItem value="TWO_TO_ONE">2:1 - Two workers per client</SelectItem>
                                    <SelectItem value="THREE_TO_ONE">3:1 - Three workers per client</SelectItem>
                                    <SelectItem value="ONE_TO_TWO">1:2 - One worker for two clients</SelectItem>
                                    <SelectItem value="ONE_TO_THREE">1:3 - One worker for three clients</SelectItem>
                                    <SelectItem value="ONE_TO_FOUR">1:4 - One worker for four clients</SelectItem>
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="supportRatio" value={supportRatio} />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">High Intensity Support</Label>
                                <p className="text-sm text-muted-foreground">
                                    Requires specialized training or credentials
                                </p>
                            </div>
                            <Switch
                                checked={isHighIntensity}
                                onCheckedChange={setIsHighIntensity}
                            />
                            <input type="hidden" name="isHighIntensity" value={isHighIntensity ? 'true' : 'false'} />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Requires Transport</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Worker needs to transport client
                                    </p>
                                </div>
                                <Switch
                                    checked={requiresTransport}
                                    onCheckedChange={setRequiresTransport}
                                />
                                <input type="hidden" name="requiresTransport" value={requiresTransport ? 'true' : 'false'} />
                            </div>

                            {requiresTransport && (
                                <div className="space-y-2 ml-4">
                                    <Label htmlFor="travelDistance">Travel Distance (km)</Label>
                                    <Input
                                        id="travelDistance"
                                        name="travelDistance"
                                        type="number"
                                        placeholder="e.g., 15"
                                        value={travelDistance}
                                        onChange={(e) => setTravelDistance(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || hasHardViolations}
                    >
                        {isLoading ? "Creating..." : "Create Shift"}
                    </Button>
                </div>
            </form>

            {/* Override Dialog */}
            <Dialog open={!!showOverrideDialog} onOpenChange={setShowOverrideDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Override Warnings</DialogTitle>
                        <DialogDescription>
                            This shift has warnings. Please provide a reason for overriding them.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="overrideReason">Reason for Override</Label>
                            <Input
                                id="overrideReason"
                                placeholder="e.g., Emergency coverage required"
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowOverrideDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleOverrideConfirm}
                            disabled={!overrideReason.trim()}
                        >
                            Override and Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
