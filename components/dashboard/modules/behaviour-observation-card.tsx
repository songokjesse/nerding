"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ModuleType } from "@/generated/prisma/client/enums"
import { Eye } from "lucide-react"

interface BehaviourObservationCardProps {
    onSave: (data: any) => Promise<void>
}

export function BehaviourObservationCard({ onSave }: BehaviourObservationCardProps) {
    const [behaviourType, setBehaviourType] = useState<string>("")
    const [severity, setSeverity] = useState<string>("")
    const [triggers, setTriggers] = useState<string>("")
    const [intervention, setIntervention] = useState<string>("")
    const [outcome, setOutcome] = useState<string>("")
    const [notes, setNotes] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    // Default to current time in HH:MM format
    const [time, setTime] = useState<string>(() => {
        const now = new Date()
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    })

    const handleSave = async () => {
        if (isSubmitting) return // Prevent double-click

        setIsSubmitting(true) // Immediate feedback

        try {
            // Construct date from today's date and selected time
            const now = new Date()
            const [hours, minutes] = time.split(':').map(Number)
            const recordedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)

            await onSave({
                moduleType: ModuleType.BEHAVIOUR_OBSERVATION,
                data: {
                    behaviourType,
                    severity,
                    triggers,
                    intervention,
                    outcome,
                    notes,
                    recordedAt: recordedAt.toISOString()
                }
            })

            // Reset form only on success
            setBehaviourType("")
            setSeverity("")
            setTriggers("")
            setIntervention("")
            setOutcome("")
            setNotes("")
            // Reset time to current
            const current = new Date()
            setTime(`${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const isValid = behaviourType && severity && triggers && intervention && outcome && time
    const isDisabled = !isValid || isSubmitting

    return (
        <Card className="border-orange-200 dark:border-orange-900">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-lg">Behaviour Observation</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Time of Observation</Label>
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Behaviour Type</Label>
                        <Select value={behaviourType} onValueChange={setBehaviourType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="aggression">Aggression</SelectItem>
                                <SelectItem value="self_harm">Self-Harm</SelectItem>
                                <SelectItem value="verbal_outburst">Verbal Outburst</SelectItem>
                                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                                <SelectItem value="agitation">Agitation</SelectItem>
                                <SelectItem value="property_damage">Property Damage</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Severity</Label>
                        <Select value={severity} onValueChange={setSeverity}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mild">Mild</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="severe">Severe</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Triggers</Label>
                    <Textarea
                        placeholder="What triggered this behaviour? (e.g., change in routine, denied request, sensory overload)..."
                        value={triggers}
                        onChange={(e) => setTriggers(e.target.value)}
                        className="h-20"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Intervention Used</Label>
                    <Textarea
                        placeholder="What intervention was used? (e.g., de-escalation techniques, redirection, time-out)..."
                        value={intervention}
                        onChange={(e) => setIntervention(e.target.value)}
                        className="h-20"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Outcome</Label>
                    <Select value={outcome} onValueChange={setOutcome}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="partially_resolved">Partially Resolved</SelectItem>
                            <SelectItem value="escalated">Escalated</SelectItem>
                            <SelectItem value="ongoing">Ongoing</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Additional Notes (Optional)</Label>
                    <Textarea
                        placeholder="Any other observations or follow-up actions needed..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="h-20"
                    />
                </div>

                <Button
                    id="save-observation-btn"
                    onClick={handleSave}
                    disabled={isDisabled}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                >
                    {isSubmitting ? "Saving..." : "Save Observation"}
                </Button>
            </CardContent>
        </Card>
    )
}
