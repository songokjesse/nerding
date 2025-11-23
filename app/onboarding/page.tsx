'use client'

import { useActionState } from 'react'
import { createOrganisation } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2 } from 'lucide-react'

export default function OnboardingPage() {
    const [state, action, isPending] = useActionState(createOrganisation, null)

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Building2 className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center">Create Organization</CardTitle>
                    <CardDescription className="text-center">
                        Set up your organization to get started
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={action} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Organization Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Acme Inc."
                                required
                                minLength={2}
                            />
                        </div>

                        {state?.error && (
                            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                                {state.error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Creating...' : 'Create Organization'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
