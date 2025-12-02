"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Search, UserPlus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Worker {
    id: string
    name: string
    email: string
}

interface WorkerSelectorProps {
    label: string
    description?: string
    selectedWorkerIds: string[]
    onChange: (workerIds: string[]) => void
    variant?: "banned" | "preferred"
}

export function WorkerSelector({
    label,
    description,
    selectedWorkerIds,
    onChange,
    variant = "preferred"
}: WorkerSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [workers, setWorkers] = useState<Worker[]>([])
    const [selectedWorkers, setSelectedWorkers] = useState<Worker[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showSearch, setShowSearch] = useState(false)

    // Fetch workers based on search
    useEffect(() => {
        if (searchQuery.length < 2) {
            setWorkers([])
            return
        }

        const fetchWorkers = async () => {
            setIsLoading(true)
            try {
                const response = await fetch(`/api/v1/users/search?q=${encodeURIComponent(searchQuery)}&role=WORKER`)
                if (response.ok) {
                    const data = await response.json()
                    setWorkers(data.users || [])
                }
            } catch (error) {
                console.error("Failed to fetch workers:", error)
            } finally {
                setIsLoading(false)
            }
        }

        const debounce = setTimeout(fetchWorkers, 300)
        return () => clearTimeout(debounce)
    }, [searchQuery])

    // Load selected workers on mount
    useEffect(() => {
        if (selectedWorkerIds.length === 0) return

        const fetchSelectedWorkers = async () => {
            try {
                const response = await fetch(`/api/v1/users/batch?ids=${selectedWorkerIds.join(',')}`)
                if (response.ok) {
                    const data = await response.json()
                    setSelectedWorkers(data.users || [])
                }
            } catch (error) {
                console.error("Failed to fetch selected workers:", error)
            }
        }

        fetchSelectedWorkers()
    }, [selectedWorkerIds])

    const handleAddWorker = (worker: Worker) => {
        if (!selectedWorkerIds.includes(worker.id)) {
            const newIds = [...selectedWorkerIds, worker.id]
            onChange(newIds)
            setSelectedWorkers([...selectedWorkers, worker])
            setSearchQuery("")
            setWorkers([])
        }
    }

    const handleRemoveWorker = (workerId: string) => {
        const newIds = selectedWorkerIds.filter(id => id !== workerId)
        onChange(newIds)
        setSelectedWorkers(selectedWorkers.filter(w => w.id !== workerId))
    }

    const badgeVariant = variant === "banned" ? "destructive" : "secondary"

    return (
        <div className="space-y-3">
            <div>
                <Label>{label}</Label>
                {description && (
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
            </div>

            {/* Selected Workers */}
            {selectedWorkers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedWorkers.map((worker) => (
                        <Badge key={worker.id} variant={badgeVariant} className="gap-1 pr-1">
                            {worker.name}
                            <button
                                type="button"
                                onClick={() => handleRemoveWorker(worker.id)}
                                className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Add Worker Button/Search */}
            {!showSearch ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSearch(true)}
                    className="gap-2"
                >
                    <UserPlus className="h-4 w-4" />
                    Add Worker
                </Button>
            ) : (
                <Card>
                    <CardContent className="p-3 space-y-2">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search workers by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                    autoFocus
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowSearch(false)
                                    setSearchQuery("")
                                    setWorkers([])
                                }}
                            >
                                Cancel
                            </Button>
                        </div>

                        {/* Search Results */}
                        {isLoading && (
                            <p className="text-sm text-muted-foreground py-2">Searching...</p>
                        )}
                        {!isLoading && searchQuery.length >= 2 && workers.length === 0 && (
                            <p className="text-sm text-muted-foreground py-2">No workers found</p>
                        )}
                        {workers.length > 0 && (
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                {workers.map((worker) => (
                                    <button
                                        key={worker.id}
                                        type="button"
                                        onClick={() => handleAddWorker(worker)}
                                        disabled={selectedWorkerIds.includes(worker.id)}
                                        className="w-full text-left p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="font-medium text-sm">{worker.name}</div>
                                        <div className="text-xs text-muted-foreground">{worker.email}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Hidden inputs for form submission */}
            {selectedWorkerIds.map((id) => (
                <input
                    key={id}
                    type="hidden"
                    name={variant === "banned" ? "bannedWorkerIds" : "preferredWorkerIds"}
                    value={id}
                />
            ))}
        </div>
    )
}
