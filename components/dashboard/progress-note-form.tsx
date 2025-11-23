'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createProgressNote } from '@/app/dashboard/notes/actions'

interface ProgressNoteFormProps {
    shiftId: string
}

export function ProgressNoteForm({ shiftId }: ProgressNoteFormProps) {
    const createNoteWithShiftId = createProgressNote.bind(null, shiftId)
    const [state, formAction, isPending] = useActionState(createNoteWithShiftId, null)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit Progress Note</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    {/* Note Text */}
                    <div className="space-y-2">
                        <Label htmlFor="noteText">Progress Note *</Label>
                        <Textarea
                            id="noteText"
                            name="noteText"
                            placeholder="Describe the shift activities, client progress, any observations..."
                            required
                            rows={6}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Minimum 10 characters required
                        </p>
                    </div>

                    {/* Flags */}
                    <div className="space-y-3">
                        <Label>Flags (optional)</Label>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="incidentFlag"
                                    name="incidentFlag"
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <label htmlFor="incidentFlag" className="text-sm">
                                    <span className="font-medium text-red-700">Incident</span>
                                    <span className="text-muted-foreground ml-2">
                                        - Report any incidents or safety concerns
                                    </span>
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="behavioursFlag"
                                    name="behavioursFlag"
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <label htmlFor="behavioursFlag" className="text-sm">
                                    <span className="font-medium text-yellow-700">Behaviour</span>
                                    <span className="text-muted-foreground ml-2">
                                        - Note any significant behavioural observations
                                    </span>
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="medicationFlag"
                                    name="medicationFlag"
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <label htmlFor="medicationFlag" className="text-sm">
                                    <span className="font-medium text-blue-700">Medication</span>
                                    <span className="text-muted-foreground ml-2">
                                        - Record medication administration or issues
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Mood */}
                    <div className="space-y-2">
                        <Label htmlFor="mood">Client Mood (optional)</Label>
                        <select
                            id="mood"
                            name="mood"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <option value="">Select mood...</option>
                            <option value="Happy">Happy</option>
                            <option value="Calm">Calm</option>
                            <option value="Neutral">Neutral</option>
                            <option value="Anxious">Anxious</option>
                            <option value="Upset">Upset</option>
                            <option value="Agitated">Agitated</option>
                        </select>
                    </div>

                    {state?.error && (
                        <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
                            {state.error}
                        </div>
                    )}

                    {state?.success && (
                        <div className="text-sm text-green-700 bg-green-50 p-3 rounded">
                            Progress note submitted successfully!
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? 'Submitting...' : 'Submit Progress Note'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
