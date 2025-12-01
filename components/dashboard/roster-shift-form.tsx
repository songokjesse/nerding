"use client"

import { useState } from "react"
import { createRosterShift } from "@/app/dashboard/shifts/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface RosterShiftFormProps {
    clients: { id: string; name: string }[]
    workers: { id: string; name: string }[]
}

export function RosterShiftForm({ clients, workers }: RosterShiftFormProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true)

        const formData = new FormData(event.currentTarget)
        const result = await createRosterShift(null, formData)

        if (result?.error) {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive"
            })
        } else {
            toast({
                title: "Success",
                description: "Shift created successfully"
            })
            router.push("/dashboard/rostering/calendar")
        }
        setIsLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
            <div className="space-y-2">
                <h2 className="text-xl font-bold">Create Roster Shift</h2>
                <p className="text-sm text-gray-500">Schedule a shift for multiple clients and workers.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input type="datetime-local" id="startTime" name="startTime" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input type="datetime-local" id="endTime" name="endTime" required />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Clients</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border p-4 rounded-md max-h-48 overflow-y-auto">
                    {clients.map(client => (
                        <div key={client.id} className="flex items-center space-x-2">
                            <Checkbox id={`client-${client.id}`} name="clientIds" value={client.id} />
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
                            <Checkbox id={`worker-${worker.id}`} name="workerIds" value={worker.id} />
                            <Label htmlFor={`worker-${worker.id}`} className="cursor-pointer font-normal">
                                {worker.name}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type (Optional)</Label>
                <Input id="serviceType" name="serviceType" placeholder="e.g. Personal Care" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input id="location" name="location" placeholder="e.g. Client Home" />
            </div>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Shift"}
                </Button>
            </div>
        </form>
    )
}
