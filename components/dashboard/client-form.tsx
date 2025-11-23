'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient, updateClient } from '@/app/dashboard/clients/actions'

interface ClientFormProps {
    client?: {
        id: string
        name: string
        ndisNumber?: string | null
        dateOfBirth?: Date | null
        notes?: string | null
    }
    readOnly?: boolean
}

export function ClientForm({ client, readOnly = false }: ClientFormProps) {
    // If client exists, we are updating, otherwise creating
    const action = client
        ? updateClient.bind(null, client.id)
        : createClient

    const [state, formAction, isPending] = useActionState(action, null)

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{client ? 'Edit Client' : 'New Client'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={client?.name}
                            required
                            disabled={readOnly}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ndisNumber">NDIS Number</Label>
                            <Input
                                id="ndisNumber"
                                name="ndisNumber"
                                defaultValue={client?.ndisNumber || ''}
                                disabled={readOnly}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                            <Input
                                id="dateOfBirth"
                                name="dateOfBirth"
                                type="date"
                                defaultValue={client?.dateOfBirth ? new Date(client.dateOfBirth).toISOString().split('T')[0] : ''}
                                disabled={readOnly}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            defaultValue={client?.notes || ''}
                            disabled={readOnly}
                            rows={4}
                        />
                    </div>

                    {state?.error && (
                        <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                            {state.error}
                        </div>
                    )}

                    {!readOnly && (
                        <div className="pt-4">
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? 'Saving...' : (client ? 'Update Client' : 'Create Client')}
                            </Button>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}
