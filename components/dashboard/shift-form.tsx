'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createShift } from '@/app/dashboard/shifts/actions'

interface ShiftFormProps {
    clients: Array<{ id: string; name: string }>
    workers: Array<{ id: string; name: string; email: string }>
}

export function ShiftForm({ clients, workers }: ShiftFormProps) {
    const [state, formAction, isPending] = useActionState(createShift, null)

    // Get current date/time for default values
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const defaultStart = tomorrow.toISOString().slice(0, 16)
    const defaultEnd = new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Schedule New Shift</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    {/* Client Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="clientId">Client *</Label>
                        <select
                            id="clientId"
                            name="clientId"
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <option value="">Select a client...</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Worker Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="workerId">Assign Worker *</Label>
                        <select
                            id="workerId"
                            name="workerId"
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <option value="">Select a worker...</option>
                            {workers.map((worker) => (
                                <option key={worker.id} value={worker.id}>
                                    {worker.name} ({worker.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date/Time Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time *</Label>
                            <Input
                                id="startTime"
                                name="startTime"
                                type="datetime-local"
                                defaultValue={defaultStart}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endTime">End Time *</Label>
                            <Input
                                id="endTime"
                                name="endTime"
                                type="datetime-local"
                                defaultValue={defaultEnd}
                                required
                            />
                        </div>
                    </div>

                    {/* Service Type */}
                    <div className="space-y-2">
                        <Label htmlFor="serviceType">Service Type</Label>
                        <Input
                            id="serviceType"
                            name="serviceType"
                            placeholder="e.g., Personal Care, Community Access"
                        />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            name="location"
                            placeholder="e.g., Client's home, Community center"
                        />
                    </div>

                    {state?.error && (
                        <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                            {state.error}
                        </div>
                    )}

                    <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Creating Shift...' : 'Create Shift'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
