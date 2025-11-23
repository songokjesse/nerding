"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateUserRole, deleteUser } from "@/app/dashboard/admin/actions"
import { Role } from "@/generated/prisma/client/enums"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"

interface User {
    id: string
    name: string
    email: string
    role: Role
    image: string | null
    createdAt: Date
}

interface UserTableProps {
    users: User[]
    currentUserEmail?: string | null
}

export function UserTable({ users, currentUserEmail }: UserTableProps) {
    const router = useRouter()
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleRoleChange = async (userId: string, newRole: Role) => {
        setLoadingId(userId)
        try {
            const result = await updateUserRole(userId, newRole)
            if (!result.success) {
                alert("Failed to update role")
            } else {
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            alert("An error occurred")
        } finally {
            setLoadingId(null)
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return
        setLoadingId(userId)
        try {
            const result = await deleteUser(userId)
            if (!result.success) {
                alert("Failed to delete user")
            } else {
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            alert("An error occurred")
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[250px]">User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.image || ""} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-medium">{user.name}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Select
                                    disabled={loadingId === user.id || user.email === currentUserEmail}
                                    defaultValue={user.role}
                                    onValueChange={(value) => handleRoleChange(user.id, value as Role)}
                                >
                                    <SelectTrigger className="w-[130px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                        <SelectItem value="MANAGER">Manager</SelectItem>
                                        <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                        <SelectItem value="VIEWER">Viewer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Link href={`/dashboard/admin/${user.id}`}>
                                    <Button variant="ghost" size="icon">
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDelete(user.id)}
                                    disabled={loadingId === user.id || user.email === currentUserEmail}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
