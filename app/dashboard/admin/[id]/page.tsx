import { UserForm } from '@/components/admin/user-form'
import { getUser } from '../actions'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { user, error } = await getUser(id)

    if (error || !user) {
        notFound()
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/admin">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Edit User</h1>
            </div>
            <UserForm user={user} />
        </div>
    )
}
