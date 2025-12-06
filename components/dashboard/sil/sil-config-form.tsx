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
import { updateSILConfig, type SILConfigData, type SILConfigResponse } from '@/app/dashboard/rostering/sites/[id]/sil-actions'
import { Loader2, Save } from 'lucide-react'

const silConfigSchema = z.object({
    isSILHouse: z.boolean().optional(),
    houseType: z.string().optional(),
    capacity: z.number().min(1).max(20).optional().or(z.literal('')),
    minStaffRatio: z.number().min(1).max(10).optional().or(z.literal('')),
    requires24_7Coverage: z.boolean().optional(),
    requiresOvernightStaff: z.boolean().optional(),
    minActiveHoursPerDay: z.number().min(0).max(24).optional().or(z.literal('')),
    maxSleepoverHoursPerDay: z.number().min(0).max(24).optional().or(z.literal('')),
    allowsSleepoverShifts: z.boolean().optional(),
    totalResidents: z.number().min(0).max(20).optional().or(z.literal('')),
    maxResidentsPerWorker: z.number().min(1).max(10).optional().or(z.literal('')),
    requiresMaleStaff: z.boolean().optional(),
    requiresFemaleStaff: z.boolean().optional(),
    preferredGenderMix: z.string().optional(),
    prefersConsistentStaff: z.boolean().optional(),
    maxNewStaffPerWeek: z.number().min(0).max(10).optional().or(z.literal('')),
    minShiftsBeforeAlone: z.number().min(0).max(20).optional().or(z.literal('')),
    requiresOnCallBackup: z.boolean().optional(),
    requiresEmergencyContact: z.boolean().optional(),
})

type SILConfigFormData = z.infer<typeof silConfigSchema>

interface SILConfigFormProps {
    siteId: string
    initialData: SILConfigResponse | null
    readOnly?: boolean
}

export function SILConfigForm({ siteId, initialData, readOnly = false }: SILConfigFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<SILConfigFormData>({
        resolver: zodResolver(silConfigSchema),
        defaultValues: {
            isSILHouse: initialData?.silConfig.isSILHouse || false,
            houseType: initialData?.silConfig.houseType || '',
            capacity: initialData?.silConfig.capacity || undefined,
            minStaffRatio: initialData?.silConfig.minStaffRatio || undefined,
            requires24_7Coverage: initialData?.silConfig.requires24_7Coverage || false,
            requiresOvernightStaff: initialData?.silConfig.requiresOvernightStaff || false,
            minActiveHoursPerDay: initialData?.silConfig.minActiveHoursPerDay || undefined,
            maxSleepoverHoursPerDay: initialData?.silConfig.maxSleepoverHoursPerDay || undefined,
            allowsSleepoverShifts: initialData?.silConfig.allowsSleepoverShifts || false,
            totalResidents: initialData?.silConfig.totalResidents || undefined,
            maxResidentsPerWorker: initialData?.silConfig.maxResidentsPerWorker || undefined,
            requiresMaleStaff: initialData?.silConfig.requiresMaleStaff || false,
            requiresFemaleStaff: initialData?.silConfig.requiresFemaleStaff || false,
            preferredGenderMix: initialData?.silConfig.preferredGenderMix || '',
            prefersConsistentStaff: initialData?.silConfig.prefersConsistentStaff || false,
            maxNewStaffPerWeek: initialData?.silConfig.maxNewStaffPerWeek || undefined,
            minShiftsBeforeAlone: initialData?.silConfig.minShiftsBeforeAlone || undefined,
            requiresOnCallBackup: initialData?.silConfig.requiresOnCallBackup || false,
            requiresEmergencyContact: initialData?.silConfig.requiresEmergencyContact || false,
        },
    })

    async function onSubmit(data: SILConfigFormData) {
        setIsSubmitting(true)
        try {
            const result = await updateSILConfig(siteId, data as SILConfigData)

            if (result.success) {
                toast.success('SIL configuration updated successfully')
            } else {
                toast.error(result.error || 'Failed to update SIL configuration')
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>
                            General house configuration and capacity
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="isSILHouse"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            SIL House
                                        </FormLabel>
                                        <FormDescription>
                                            This is a Supported Independent Living house
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
                            name="houseType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>House Type</FormLabel>
                                    <Select
                                        disabled={readOnly}
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select house type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="SHARED">Shared Living</SelectItem>
                                            <SelectItem value="GROUP_HOME">Group Home</SelectItem>
                                            <SelectItem value="APARTMENT">Apartment</SelectItem>
                                            <SelectItem value="OTHER">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="capacity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>House Capacity</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="e.g., 4"
                                            disabled={readOnly}
                                            {...field}
                                            value={field.value || ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Maximum number of residents the house can accommodate
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Staffing Requirements */}
                <Card>
                    <CardHeader>
                        <CardTitle>Staffing Requirements</CardTitle>
                        <CardDescription>
                            Define minimum staffing levels and coverage needs
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="minStaffRatio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Minimum Staff Ratio</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="e.g., 1"
                                            disabled={readOnly}
                                            {...field}
                                            value={field.value || ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Minimum number of staff required per shift
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="requires24_7Coverage"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            24/7 Coverage Required
                                        </FormLabel>
                                        <FormDescription>
                                            House requires staff coverage at all times
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
                            name="requiresOvernightStaff"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Overnight Staff Required
                                        </FormLabel>
                                        <FormDescription>
                                            House requires active staff during overnight hours
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

                {/* Shift Mix Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Shift Mix Configuration</CardTitle>
                        <CardDescription>
                            Configure the balance of active and sleepover shifts
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="minActiveHoursPerDay"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Min Active Hours/Day</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="e.g., 16"
                                                disabled={readOnly}
                                                {...field}
                                                value={field.value || ''}
                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : '')}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Minimum active support hours per day
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="maxSleepoverHoursPerDay"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Sleepover Hours/Day</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="e.g., 8"
                                                disabled={readOnly}
                                                {...field}
                                                value={field.value || ''}
                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : '')}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Maximum sleepover hours per day
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="allowsSleepoverShifts"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Allow Sleepover Shifts
                                        </FormLabel>
                                        <FormDescription>
                                            Workers can sleep on-site during overnight shifts
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

                {/* Resident Management */}
                <Card>
                    <CardHeader>
                        <CardTitle>Resident Management</CardTitle>
                        <CardDescription>
                            Configure resident numbers and worker ratios
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="totalResidents"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Total Residents</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="e.g., 4"
                                                disabled={readOnly}
                                                {...field}
                                                value={field.value || ''}
                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Current number of residents
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="maxResidentsPerWorker"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Residents per Worker</FormLabel>
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
                                            Maximum residents per worker
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Gender Requirements */}
                <Card>
                    <CardHeader>
                        <CardTitle>Gender Requirements</CardTitle>
                        <CardDescription>
                            Specify gender-based staffing requirements
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="requiresMaleStaff"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Requires Male Staff
                                        </FormLabel>
                                        <FormDescription>
                                            At least one male staff member must be on shift
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
                            name="requiresFemaleStaff"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Requires Female Staff
                                        </FormLabel>
                                        <FormDescription>
                                            At least one female staff member must be on shift
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
                            name="preferredGenderMix"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Preferred Gender Mix</FormLabel>
                                    <Select
                                        disabled={readOnly}
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select preference" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ANY">Any</SelectItem>
                                            <SelectItem value="BALANCED">Balanced Mix</SelectItem>
                                            <SelectItem value="MOSTLY_MALE">Mostly Male</SelectItem>
                                            <SelectItem value="MOSTLY_FEMALE">Mostly Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Preferred gender balance for staff team
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Continuity Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle>Continuity Preferences</CardTitle>
                        <CardDescription>
                            Configure staff consistency and familiarity requirements
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="prefersConsistentStaff"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Prefer Consistent Staff
                                        </FormLabel>
                                        <FormDescription>
                                            Residents benefit from familiar, consistent support workers
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="maxNewStaffPerWeek"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max New Staff per Week</FormLabel>
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
                                            Maximum new staff to introduce per week
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="minShiftsBeforeAlone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Min Shifts Before Alone</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="e.g., 3"
                                                disabled={readOnly}
                                                {...field}
                                                value={field.value || ''}
                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Minimum shifts with experienced staff before working alone
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Emergency Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Emergency Configuration</CardTitle>
                        <CardDescription>
                            Configure emergency support and contact requirements
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="requiresOnCallBackup"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            On-Call Backup Required
                                        </FormLabel>
                                        <FormDescription>
                                            House requires on-call staff backup for emergencies
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
                            name="requiresEmergencyContact"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Emergency Contact Required
                                        </FormLabel>
                                        <FormDescription>
                                            House requires designated emergency contact person
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
