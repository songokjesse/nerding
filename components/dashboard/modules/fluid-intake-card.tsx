"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ModuleType } from "@/generated/prisma/client/enums"
import { Droplets } from "lucide-react"

interface FluidIntakeCardProps {
    onSave: (data: any) => Promise<void>
    isSaving: boolean
}

export function FluidIntakeCard({ onSave, isSaving }: FluidIntakeCardProps) {
    const [fluidType, setFluidType] = useState<string>("")
    const [amount, setAmount] = useState<string>("")
    const [notes, setNotes] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    // Default to current time in HH:MM format
    const [time, setTime] = useState<string>(() => {
        const now = new Date()
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    })

    const handleSave = async () => {
        if (isSubmitting || isSaving) return // Prevent double-click

        setIsSubmitting(true) // Immediate feedback

        try {
            // Construct date from today's date and selected time
            const now = new Date()
            const [hours, minutes] = time.split(':').map(Number)
            const recordedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)

            await onSave({
                moduleType: ModuleType.FLUID_INTAKE,
                data: {
                    fluidType,
                    amount: parseInt(amount),
                    notes,
                    recordedAt: recordedAt.toISOString()
                }
            })

            // Reset form only on success
            setFluidType("")
            setAmount("")
            setNotes("")
            // Reset time to current
            const current = new Date()
            setTime(`${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const isValid = fluidType && amount && time && parseInt(amount) > 0
    const isDisabled = !isValid || isSubmitting || isSaving

    return (
        <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">Fluid Intake</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Time of Intake</Label>
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Fluid Type</Label>
                        <Select value={fluidType} onValueChange={setFluidType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="water">Water</SelectItem>
                                <SelectItem value="juice">Juice</SelectItem>
                                <SelectItem value="tea">Tea</SelectItem>
                                <SelectItem value="coffee">Coffee</SelectItem>
                                <SelectItem value="milk">Milk</SelectItem>
                                <SelectItem value="soft_drink">Soft Drink</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Amount (mL)</Label>
                        <Input
                            type="number"
                            placeholder="250"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="0"
                            step="50"
                        />
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

                <Button
                    id="save-observation-btn"
                    onClick={handleSave}
                    disabled={isDisabled}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                >
                    {isSubmitting || isSaving ? "Saving..." : "Save Observation"}
                </Button>
            </CardContent>
        </Card>
    )
}
