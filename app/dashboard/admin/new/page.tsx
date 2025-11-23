import { UserForm } from '@/components/admin/user-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewUserPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/admin">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Create User</h1>
            </div>
            <UserForm />
        </div>
    )
}
