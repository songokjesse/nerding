'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'
import { updateMemberSettings } from '@/app/dashboard/members/actions'
import { useToast } from '@/components/ui/use-toast'

interface WorkerSettingsDialogProps {
    userId: string
    userName: string
    currentMaxHours: number | null
}

export function WorkerSettingsDialog({ userId, userName, currentMaxHours }: WorkerSettingsDialogProps) {
    const [open, setOpen] = useState(false)
    const [maxHours, setMaxHours] = useState<string>(currentMaxHours?.toString() || '')
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const handleSave = async () => {
        setLoading(true)
        try {
            const hours = maxHours ? parseFloat(maxHours) : null
            const result = await updateMemberSettings(userId, hours)

            if (result.error) {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive"
                })
            } else {
                toast({
                    title: "Settings updated",
                    description: `Max hours for ${userName} set to ${hours || 'unlimited'}.`,
                    variant: "success"
                })
                setOpen(false)
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update settings",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Worker Settings</DialogTitle>
                    <DialogDescription>
                        Configure settings for {userName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="maxHours" className="text-right">
                            Max Hours (Fortnight)
                        </Label>
                        <Input
                            id="maxHours"
                            type="number"
                            value={maxHours}
                            onChange={(e) => setMaxHours(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g. 48"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
