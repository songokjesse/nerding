"use client"

import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Settings, LogOut, Shield } from "lucide-react"

interface NavbarProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
        role?: string | null
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
            <div className="flex items-center gap-8">
                <h1 className="text-xl font-bold">CareNotely</h1>
                <div className="hidden md:flex items-center gap-1">
                    <Link href="/dashboard" prefetch>
                        <Button
                            variant="ghost"
                            size="sm"
                        >
                            Dashboard
                        </Button>
                    </Link>
                    <Link href="/dashboard/clients" prefetch>
                        <Button
                            variant="ghost"
                            size="sm"
                        >
                            Clients
                        </Button>
                    </Link>
                    <Link href="/dashboard/shifts" prefetch>
                        <Button
                            variant="ghost"
                            size="sm"
                        >
                            Shifts
                        </Button>
                    </Link>
                    <Link href="/dashboard/my-shifts" prefetch>
                        <Button
                            variant="ghost"
                            size="sm"
                        >
                            My Shifts
                        </Button>
                    </Link>
                    <Link href="/dashboard/members" prefetch>
                        <Button
                            variant="ghost"
                            size="sm"
                        >
                            Members
                        </Button>
                    </Link>
                    <Link href="/dashboard/reports" prefetch>
                        <Button
                            variant="ghost"
                            size="sm"
                        >
                            Reports
                        </Button>
                    </Link>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user.image || ""} alt={user.name || ""} />
                                <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        {user.role === "ADMIN" && (
                            <DropdownMenuItem onClick={() => router.push("/dashboard/admin")}>
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Admin Panel</span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    )
}
