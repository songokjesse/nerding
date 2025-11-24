"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ModuleType } from "@/generated/prisma/client/enums"
import { Activity } from "lucide-react"

interface BowelMonitoringCardProps {
    onSave: (data: any) => void
    isSaving: boolean
}

const bristolScale = [
    { value: "1", label: "Type 1: Separate hard lumps", description: "Hard to pass" },
    { value: "2", label: "Type 2: Sausage-shaped, lumpy", description: "" },
    { value: "3", label: "Type 3: Sausage-shaped, cracks", description: "" },
    { value: "4", label: "Type 4: Sausage-shaped, smooth", description: "Normal" },
    { value: "5", label: "Type 5: Soft blobs, clear edges", description: "Passed easily" },
    { value: "6", label: "Type 6: Fluffy pieces, ragged", description: "Mushy" },
    { value: "7", label: "Type 7: Watery, no solid pieces", description: "Liquid" },
]

export function BowelMonitoringCard({ onSave, isSaving }: BowelMonitoringCardProps) {
    const [type, setType] = useState<string>("")
    const [consistency, setConsistency] = useState<string>("")
    const [color, setColor] = useState<string>("")
    const [concerns, setConcerns] = useState<string>("")

    const handleSave = () => {
        onSave({
            moduleType: ModuleType.BOWEL_MONITORING,
            data: {
                type,
                consistency,
                color,
                concerns,
                recordedAt: new Date().toISOString()
            }
        })
        // Reset form
        setType("")
        setConsistency("")
        setColor("")
        setConcerns("")
    }

    const isValid = type && consistency && color

    return (
        <Card className="border-purple-200 dark:border-purple-900">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-lg">Bowel Monitoring</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Bristol Stool Scale</Label>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            {bristolScale.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    <span className="font-medium">{item.label}</span>
                                    {item.description && <span className="text-muted-foreground ml-2">({item.description})</span>}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Consistency</Label>
                        <Select value={consistency} onValueChange={setConsistency}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hard">Hard</SelectItem>
                                <SelectItem value="firm">Firm</SelectItem>
                                <SelectItem value="soft">Soft</SelectItem>
                                <SelectItem value="loose">Loose</SelectItem>
                                <SelectItem value="liquid">Liquid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Color</Label>
                        <Select value={color} onValueChange={setColor}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="brown">Brown</SelectItem>
                                <SelectItem value="dark_brown">Dark Brown</SelectItem>
                                <SelectItem value="black">Black</SelectItem>
                                <SelectItem value="clay">Clay/Pale</SelectItem>
                                <SelectItem value="green">Green</SelectItem>
                                <SelectItem value="red">Red/Blood</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Concerns / Notes</Label>
                    <Textarea
                        placeholder="Any pain, straining, or other observations..."
                        value={concerns}
                        onChange={(e) => setConcerns(e.target.value)}
                        className="h-20"
                    />
                </div>

                <Button
                    id="save-observation-btn"
                    onClick={handleSave}
                    disabled={!isValid || isSaving}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                >
                    {isSaving ? "Saving..." : "Save Observation"}
                </Button>
            </CardContent>
        </Card>
    )
}
