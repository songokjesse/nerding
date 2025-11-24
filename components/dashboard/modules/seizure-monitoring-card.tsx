"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ModuleType } from "@/generated/prisma/client/enums"
import { Brain } from "lucide-react"

interface SeizureMonitoringCardProps {
    onSave: (data: any) => void
    isSaving: boolean
}

export function SeizureMonitoringCard({ onSave, isSaving }: SeizureMonitoringCardProps) {
    const [seizureType, setSeizureType] = useState<string>("")
    const [duration, setDuration] = useState<string>("")
    const [severity, setSeverity] = useState<string>("")
    const [postIctalState, setPostIctalState] = useState<string>("")
    const [notes, setNotes] = useState<string>("")
    // Default to current time in HH:MM format
    const [time, setTime] = useState<string>(() => {
        const now = new Date()
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    })

    const handleSave = () => {
        // Construct date from today's date and selected time
        const now = new Date()
        const [hours, minutes] = time.split(':').map(Number)
        const recordedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)

        onSave({
            moduleType: ModuleType.SEIZURE_MONITORING,
            data: {
                seizureType,
                duration: parseInt(duration),
                severity,
                postIctalState,
                notes,
                recordedAt: recordedAt.toISOString()
            }
        })
        // Reset form
        setSeizureType("")
        setDuration("")
        setSeverity("")
        setPostIctalState("")
        setNotes("")
        // Reset time to current
        const current = new Date()
        setTime(`${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`)
    }

    const isValid = seizureType && duration && severity && time && parseInt(duration) > 0

    return (
        <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-red-500" />
                    <CardTitle className="text-lg">Seizure Monitoring</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Time of Seizure</Label>
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Seizure Type</Label>
                    <Select value={seizureType} onValueChange={setSeizureType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tonic_clonic">Tonic-Clonic (Grand Mal)</SelectItem>
                            <SelectItem value="absence">Absence (Petit Mal)</SelectItem>
                            <SelectItem value="focal">Focal (Partial)</SelectItem>
                            <SelectItem value="myoclonic">Myoclonic</SelectItem>
                            <SelectItem value="atonic">Atonic (Drop)</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Duration (minutes)</Label>
                        <Input
                            type="number"
                            placeholder="5"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            min="0"
                            step="0.5"
                        />
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
                    <Label>Post-Ictal State</Label>
                    <Textarea
                        placeholder="Describe the state after the seizure (confusion, drowsiness, etc.)..."
                        value={postIctalState}
                        onChange={(e) => setPostIctalState(e.target.value)}
                        className="h-20"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Additional Notes (Optional)</Label>
                    <Textarea
                        placeholder="Any triggers, medications given, or other observations..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="h-20"
                    />
                </div>

                <Button
                    id="save-observation-btn"
                    onClick={handleSave}
                    disabled={!isValid || isSaving}
                    className="w-full bg-red-600 hover:bg-red-700"
                >
                    {isSaving ? "Saving..." : "Save Observation"}
                </Button>
            </CardContent>
        </Card>
    )
}
