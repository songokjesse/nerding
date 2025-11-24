"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, LayoutGrid, List as ListIcon, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface Client {
    id: string
    name: string
    ndisNumber?: string | null
    dateOfBirth?: Date | null
    notes?: string | null
}

interface ClientListViewProps {
    clients: Client[]
    canCreate: boolean
}

export function ClientListView({ clients, canCreate }: ClientListViewProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const [searchQuery, setSearchQuery] = useState("")

    const filteredClients = clients.filter((client) => {
        const query = searchQuery.toLowerCase()
        return (
            client.name.toLowerCase().includes(query) ||
            (client.ndisNumber && client.ndisNumber.toLowerCase().includes(query))
        )
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold">Clients</h1>
                <div className="flex items-center gap-2">
                    {canCreate && (
                        <Link href="/dashboard/clients/new">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Client
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search clients..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center rounded-md border bg-background p-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 px-2 ${viewMode === "grid" ? "bg-muted" : ""}`}
                        onClick={() => setViewMode("grid")}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 px-2 ${viewMode === "list" ? "bg-muted" : ""}`}
                        onClick={() => setViewMode("list")}
                    >
                        <ListIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {filteredClients.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                    No clients found matching your search.
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredClients.map((client) => (
                        <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
                            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                                <CardHeader>
                                    <CardTitle>{client.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        {client.ndisNumber && <p>NDIS: {client.ndisNumber}</p>}
                                        {client.dateOfBirth && (
                                            <p>
                                                DOB: {new Date(client.dateOfBirth).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="rounded-md border bg-white dark:bg-gray-900">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>NDIS Number</TableHead>
                                <TableHead>Date of Birth</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">
                                        <Link
                                            href={`/dashboard/clients/${client.id}`}
                                            className="hover:underline"
                                        >
                                            {client.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{client.ndisNumber || "-"}</TableCell>
                                    <TableCell>
                                        {client.dateOfBirth
                                            ? new Date(client.dateOfBirth).toLocaleDateString()
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={`/dashboard/clients/${client.id}`}>View</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
