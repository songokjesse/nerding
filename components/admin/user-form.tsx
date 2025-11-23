'use client'

import { useActionState } from 'react'
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
import { createUser, updateUser } from '@/app/dashboard/admin/actions'
import { Role } from '@/generated/prisma/client/enums'
import { useRouter } from 'next/navigation'

interface UserFormProps {
    user?: {
        id: string
        name: string
        email: string
        role: Role
    }
}

export function UserForm({ user }: UserFormProps) {
    const router = useRouter()
    const action = user
        ? updateUser.bind(null, user.id)
        : createUser

    const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
        const result = await action(prev, formData)
        if (result.success) {
            router.push('/dashboard/admin')
        }
        return result
    }, null)

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>{user ? 'Edit User' : 'Create User'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={user?.name}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={user?.email}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select name="role" defaultValue={user?.role || Role.VIEWER}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                                <SelectItem value={Role.MANAGER}>Manager</SelectItem>
                                <SelectItem value={Role.EMPLOYEE}>Employee</SelectItem>
                                <SelectItem value={Role.VIEWER}>Viewer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {state?.error && (
                        <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                            {state.error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? 'Saving...' : (user ? 'Update User' : 'Create User')}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
