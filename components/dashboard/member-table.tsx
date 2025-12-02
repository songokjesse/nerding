'use client'

import { useState } from 'react'
import { OrgRole } from '@/generated/prisma/client/enums'
import { updateMemberRole, removeMember } from '@/app/dashboard/members/actions'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trash2, Shield } from 'lucide-react'
import Link from 'next/link'

import { WorkerSettingsDialog } from '@/components/dashboard/worker-settings-dialog'

interface Member {
    id: string
    role: OrgRole
    user: {
        id: string
        name: string
        email: string
        image: string | null
        maxFortnightlyHours?: number | null
    }
}

interface MemberTableProps {
    members: Member[]
    currentUserRole: OrgRole
    currentUserId: string
}

export function MemberTable({ members, currentUserRole, currentUserId }: MemberTableProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleRoleChange = async (memberId: string, newRole: OrgRole) => {
        setLoadingId(memberId)
        try {
            await updateMemberRole(memberId, newRole)
        } catch (error) {
            console.error('Failed to update role', error)
        } finally {
            setLoadingId(null)
        }
    }

    const handleRemove = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return

        setLoadingId(memberId)
        try {
            await removeMember(memberId)
        } catch (error) {
            console.error('Failed to remove member', error)
        } finally {
            setLoadingId(null)
        }
    }

    const canManage = currentUserRole === OrgRole.ORG_ADMIN

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Credentials</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.map((member) => (
                        <TableRow key={member.id}>
                            <TableCell className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={member.user.image || ''} />
                                    <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{member.user.name}</div>
                                    <div className="text-sm text-gray-500">{member.user.email}</div>
                                </div>
                            </TableCell>
                            <TableCell>
                                {canManage && member.user.id !== currentUserId ? (
                                    <Select
                                        defaultValue={member.role}
                                        onValueChange={(value) => handleRoleChange(member.id, value as OrgRole)}
                                        disabled={loadingId === member.id}
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={OrgRole.ORG_ADMIN}>Admin</SelectItem>
                                            <SelectItem value={OrgRole.COORDINATOR}>Coordinator</SelectItem>
                                            <SelectItem value={OrgRole.WORKER}>Worker</SelectItem>
                                            <SelectItem value={OrgRole.VIEWER}>Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <span className="px-2 py-1 rounded-full bg-gray-100 text-xs font-medium">
                                        {member.role}
                                    </span>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Link href={`/dashboard/rostering/workers/${member.user.id}/credentials`}>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Shield className="w-4 h-4" />
                                            Credentials
                                        </Button>
                                    </Link>
                                    {canManage && (
                                        <WorkerSettingsDialog
                                            userId={member.user.id}
                                            userName={member.user.name}
                                            currentMaxHours={member.user.maxFortnightlyHours || null}
                                        />
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                {canManage && member.user.id !== currentUserId && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemove(member.id)}
                                        disabled={loadingId === member.id}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
