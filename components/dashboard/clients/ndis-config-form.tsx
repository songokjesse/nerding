'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { updateNDISConfig, type NDISConfigData, type NDISConfigResponse } from '@/app/dashboard/clients/[id]/ndis-actions'
import { Loader2, Save } from 'lucide-react'

const ndisConfigSchema = z.object({
    supportRatio: z.enum(['ONE_TO_ONE', 'TWO_TO_ONE', 'THREE_TO_ONE', 'ONE_TO_TWO', 'ONE_TO_THREE', 'ONE_TO_FOUR']).optional(),
    requiresOvernightSupport: z.boolean().optional(),
    allowsSleepoverShifts: z.boolean().optional(),
    ndisAllocatedHours: z.number().min(0).optional().or(z.literal('')),
    ndisFundingPeriod: z.string().optional(),
    ndisPlanStartDate: z.string().optional(),
    ndisPlanEndDate: z.string().optional(),
    isSILResident: z.boolean().optional(),
    requiresConsistentStaff: z.boolean().optional(),
    maxNewStaffPerMonth: z.number().min(0).max(20).optional().or(z.literal('')),
})

type NDISConfigFormData = z.infer<typeof ndisConfigSchema>

interface NDISConfigFormProps {
    clientId: string
    initialData: NDISConfigResponse | null
    readOnly?: boolean
}

const supportRatioLabels: Record<string, string> = {
    'ONE_TO_ONE': '1:1 - One worker per client',
    'TWO_TO_ONE': '2:1 - Two workers per client',
    'THREE_TO_ONE': '3:1 - Three workers per client',
    'ONE_TO_TWO': '1:2 - One worker for two clients',
    'ONE_TO_THREE': '1:3 - One worker for three clients',
    'ONE_TO_FOUR': '1:4 - One worker for four clients',
}

export function NDISConfigForm({ clientId, initialData, readOnly = false }: NDISConfigFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<NDISConfigFormData>({
        resolver: zodResolver(ndisConfigSchema),
        defaultValues: {
            supportRatio: (initialData?.ndisConfig.supportRatio as any) || 'ONE_TO_ONE',
            requiresOvernightSupport: initialData?.ndisConfig.requiresOvernightSupport || false,
            allowsSleepoverShifts: initialData?.ndisConfig.allowsSleepoverShifts || false,
            ndisAllocatedHours: initialData?.ndisConfig.ndisAllocatedHours || undefined,
            ndisFundingPeriod: initialData?.ndisConfig.ndisFundingPeriod || '',
            ndisPlanStartDate: initialData?.ndisConfig.ndisPlanStartDate?.split('T')[0] || '',
            ndisPlanEndDate: initialData?.ndisConfig.ndisPlanEndDate?.split('T')[0] || '',
            isSILResident: initialData?.ndisConfig.isSILResident || false,
            requiresConsistentStaff: initialData?.ndisConfig.requiresConsistentStaff || false,
            maxNewStaffPerMonth: initialData?.ndisConfig.maxNewStaffPerMonth || undefined,
        },
    })

    async function onSubmit(data: NDISConfigFormData) {
        setIsSubmitting(true)
        try {
            const result = await updateNDISConfig(clientId, data as NDISConfigData)

            if (result.success) {
                toast.success('NDIS configuration updated successfully')
            } else {
                toast.error(result.error || 'Failed to update NDIS configuration')
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const hoursUsed = initialData?.ndisConfig.hoursUsedThisPeriod || 0
    const hoursRemaining = initialData?.ndisConfig.hoursRemainingThisPeriod
    const allocatedHours = initialData?.ndisConfig.ndisAllocatedHours
    const percentageUsed = allocatedHours ? Math.round((hoursUsed / allocatedHours) * 100) : 0

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Support Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Support Configuration</CardTitle>
                        <CardDescription>
                            Define the support ratio and shift types for this client
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="supportRatio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Support Ratio</FormLabel>
                                    <Select
                                        disabled={readOnly}
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select support ratio" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.entries(supportRatioLabels).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        The ratio of workers to clients required for this support
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="requiresOvernightSupport"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Requires Overnight Support
                                        </FormLabel>
                                        <FormDescription>
                                            Client needs active support during overnight hours
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            disabled={readOnly}
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="allowsSleepoverShifts"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Allows Sleepover Shifts
                                        </FormLabel>
                                        <FormDescription>
                                            Worker can sleep on-site during overnight shifts
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            disabled={readOnly}
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* NDIS Funding */}
                <Card>
                    <CardHeader>
                        <CardTitle>NDIS Funding</CardTitle>
                        <CardDescription>
                            Manage NDIS plan hours and funding period
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="ndisAllocatedHours"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Allocated Hours</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="e.g., 520"
                                            disabled={readOnly}
                                            {...field}
                                            value={field.value || ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : '')}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Total hours allocated in the NDIS plan
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {allocatedHours && (
                            <div className="rounded-lg border p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Hours Used:</span>
                                    <span className="font-medium">{hoursUsed.toFixed(1)} hours</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Hours Remaining:</span>
                                    <span className="font-medium">{hoursRemaining?.toFixed(1) || '0.0'} hours</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2.5 mt-2">
                                    <div
                                        className={`h-2.5 rounded-full ${percentageUsed >= 90 ? 'bg-red-600' :
                                                percentageUsed >= 70 ? 'bg-yellow-600' :
                                                    'bg-green-600'
                                            }`}
                                        style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-muted-foreground text-center">
                                    {percentageUsed}% utilized
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="ndisPlanStartDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Plan Start Date</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                disabled={readOnly}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="ndisPlanEndDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Plan End Date</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                disabled={readOnly}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="ndisFundingPeriod"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Funding Period (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., 2024-01-01 to 2024-12-31"
                                            disabled={readOnly}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Human-readable funding period description
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* SIL Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>SIL Configuration</CardTitle>
                        <CardDescription>
                            Supported Independent Living preferences
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="isSILResident"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            SIL Resident
                                        </FormLabel>
                                        <FormDescription>
                                            Client lives in a Supported Independent Living house
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            disabled={readOnly}
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="requiresConsistentStaff"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Requires Consistent Staff
                                        </FormLabel>
                                        <FormDescription>
                                            Client benefits from familiar, consistent support workers
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            disabled={readOnly}
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="maxNewStaffPerMonth"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Max New Staff Per Month</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="e.g., 2"
                                            disabled={readOnly}
                                            {...field}
                                            value={field.value || ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Maximum number of new staff members to introduce per month
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {!readOnly && (
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Configuration
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    )
}
