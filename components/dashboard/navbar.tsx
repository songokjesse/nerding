"use client"

import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

interface NavbarProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
}

export function Navbar({ user }: NavbarProps) {
    const router = useRouter()

    const handleSignOut = async () => {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/sign-in")
                },
            },
        })
    }

    return (
        <nav className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-950">
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">Nerding</h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                    {user.name || user.email}
                </div>
                <Button variant="ghost" onClick={() => router.push("/dashboard/profile")}>
                    Profile
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                </Button>
            </div>
        </nav>
    )
}
