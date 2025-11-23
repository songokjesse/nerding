import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getUsers } from "./actions"
import { UserTable } from "@/components/admin/user-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function AdminPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user) {
        return redirect("/sign-in")
    }

    if (session.user.role !== "ADMIN") {
        return redirect("/dashboard")
    }

    const { data: users, success } = await getUsers()

    if (!success || !users) {
        return <div>Failed to load users</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <main className="max-w-6xl mx-auto p-6 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Admin Panel</h1>
                        <p className="text-muted-foreground">Manage users and roles</p>
                    </div>
                    <Link href="/dashboard/admin/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create User
                        </Button>
                    </Link>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <UserTable users={users} currentUserEmail={session.user.email} />
                </div>
            </main>
        </div>
    )
}
