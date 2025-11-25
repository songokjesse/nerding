"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ModuleType } from "@/generated/prisma/client/enums"
import { Activity } from "lucide-react"

interface BGLMonitoringCardProps {
    onSave: (data: any) => Promise<void>
}

export function BGLMonitoringCard({ onSave }: BGLMonitoringCardProps) {
    const [reading, setReading] = useState<string>("")
    const [mealContext, setMealContext] = useState<string>("")
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
                moduleType: ModuleType.BGL_MONITORING,
                data: {
                    reading: parseFloat(reading),
                    mealContext,
                    notes,
                    recordedAt: recordedAt.toISOString()
                }
            })

            // Reset form only on success
            setReading("")
            setMealContext("")
            setNotes("")
            // Reset time to current
            const current = new Date()
            setTime(`${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const isValid = reading && parseFloat(reading) > 0 && mealContext && time
    const isDisabled = !isValid || isSubmitting

    // Determine reading status for visual feedback
    const getReadingStatus = () => {
        const value = parseFloat(reading)
        if (!value) return null

        if (mealContext === "Fasting" || mealContext === "Before Meal") {
            if (value < 4.0) return "low"
            if (value > 7.0) return "high"
            return "normal"
        } else if (mealContext === "After Meal") {
            if (value < 5.0) return "low"
            if (value > 10.0) return "high"
            return "normal"
        }
        return null
    }

    const readingStatus = getReadingStatus()

    return (
        <Card className="border-green-200 dark:border-green-900">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg">BGL Monitoring</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Time of Reading</Label>
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>BGL Reading (mmol/L)</Label>
                        <Input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="e.g., 5.5"
                            value={reading}
                            onChange={(e) => setReading(e.target.value)}
                        />
                        {readingStatus && (
                            <p className={`text-xs ${readingStatus === 'low' ? 'text-orange-600' :
                                    readingStatus === 'high' ? 'text-red-600' :
                                        'text-green-600'
                                }`}>
                                {readingStatus === 'low' ? '⚠️ Low' :
                                    readingStatus === 'high' ? '⚠️ High' :
                                        '✓ Normal range'}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Meal Context</Label>
                        <Select value={mealContext} onValueChange={setMealContext}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Fasting">Fasting</SelectItem>
                                <SelectItem value="Before Meal">Before Meal</SelectItem>
                                <SelectItem value="After Meal">After Meal (2hrs)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                        placeholder="Any additional observations..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="h-20"
                    />
                </div>

                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    <p className="font-medium mb-1">Normal Ranges:</p>
                    <p>• Fasting/Before Meal: 4.0-7.0 mmol/L</p>
                    <p>• After Meal (2hrs): 5.0-10.0 mmol/L</p>
                </div>

                <Button
                    id="save-observation-btn"
                    onClick={handleSave}
                    disabled={isDisabled}
                    className="w-full bg-green-600 hover:bg-green-700"
                >
                    {isSubmitting ? "Saving..." : "Save Observation"}
                </Button>
            </CardContent>
        </Card>
    )
}
