"use client"

import { useState } from "react"
import { CredentialType } from "@/generated/prisma/client/enums"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Clock, FileText, Pencil, Trash2 } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Credential {
    id: string
    type: CredentialType
    issueDate: string
    expiryDate?: string | null
    documentUrl?: string | null
    verified: boolean
}

interface WorkerCredentialsListProps {
    credentials: Credential[]
    onEdit: (credential: Credential) => void
    onDelete: (credentialId: string) => Promise<{ error?: string; success?: boolean }>
}

export function WorkerCredentialsList({ credentials, onEdit, onDelete }: WorkerCredentialsListProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!deleteId) return

        setIsDeleting(true)
        await onDelete(deleteId)
        setIsDeleting(false)
        setDeleteId(null)
    }

    const getExpiryStatus = (expiryDate?: string | null) => {
        if (!expiryDate) return { status: 'none', label: 'No Expiry', color: 'default' }

        const now = new Date()
        const expiry = new Date(expiryDate)
        const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntilExpiry < 0) {
            return { status: 'expired', label: 'Expired', color: 'destructive', icon: AlertCircle }
        } else if (daysUntilExpiry <= 30) {
            return { status: 'expiring', label: `Expires in ${daysUntilExpiry}d`, color: 'warning', icon: Clock }
        } else {
            return { status: 'valid', label: 'Valid', color: 'success', icon: CheckCircle2 }
        }
    }

    const formatCredentialType = (type: CredentialType) => {
        return type.replace(/_/g, ' ').split(' ')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ')
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    if (credentials.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg bg-gray-50">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No credentials</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a credential.</p>
            </div>
        )
    }

    return (
        <>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Credential Type</TableHead>
                            <TableHead>Issue Date</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Verified</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {credentials.map((credential) => {
                            const expiryStatus = getExpiryStatus(credential.expiryDate)
                            const StatusIcon = expiryStatus.icon

                            return (
                                <TableRow key={credential.id}>
                                    <TableCell className="font-medium">
                                        {formatCredentialType(credential.type)}
                                    </TableCell>
                                    <TableCell>{formatDate(credential.issueDate)}</TableCell>
                                    <TableCell>
                                        {credential.expiryDate ? formatDate(credential.expiryDate) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                expiryStatus.color === 'destructive' ? 'destructive' :
                                                    expiryStatus.color === 'warning' ? 'outline' :
                                                        expiryStatus.color === 'success' ? 'default' : 'secondary'
                                            }
                                            className="flex items-center gap-1 w-fit"
                                        >
                                            {StatusIcon && <StatusIcon className="h-3 w-3" />}
                                            {expiryStatus.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {credential.verified ? (
                                            <Badge variant="default" className="bg-green-600">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">Unverified</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {credential.documentUrl && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => window.open(credential.documentUrl!, '_blank')}
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEdit(credential)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteId(credential.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Credential?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the credential.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
