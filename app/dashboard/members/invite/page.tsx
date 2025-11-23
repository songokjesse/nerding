'use client'

import { useActionState } from 'react'
import { inviteMember } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrgRole } from '@/generated/prisma/client/enums'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function InviteMemberPage() {
    const [state, action, isPending] = useActionState(inviteMember, null)

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/members">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Invite Member</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Add Existing User</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={action} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="user@example.com"
                                required
                            />
                            <p className="text-xs text-gray-500">
                                The user must already have an account on the platform.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select name="role" defaultValue={OrgRole.WORKER}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={OrgRole.ORG_ADMIN}>Admin</SelectItem>
                                    <SelectItem value={OrgRole.COORDINATOR}>Coordinator</SelectItem>
                                    <SelectItem value={OrgRole.WORKER}>Worker</SelectItem>
                                    <SelectItem value={OrgRole.VIEWER}>Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {state?.error && (
                            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                                {state.error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Adding...' : 'Add Member'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
