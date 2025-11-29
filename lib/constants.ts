/**
 * NDIS Service Type Constants
 * 
 * Standard service categories for NDIS support work.
 * These align with common NDIS support categories.
 */

export const NDIS_SERVICE_TYPES = [
    'Personal Care',
    'Community Access',
    'Domestic Assistance',
    'Transport',
    'Social Support',
    'Skill Development',
    'Therapy Support',
    'Nursing Care',
    'Overnight Support',
    'Group Activities',
    'Respite Care',
    'Meal Preparation',
    'Assistance with Daily Living',
    'SIL House Implementation',
] as const

export type ServiceType = typeof NDIS_SERVICE_TYPES[number]

/**
 * Service type display configuration
 * Maps service types to icons and colors for visual representation
 */
export const SERVICE_TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
    'Personal Care': { icon: '🏠', color: '#3b82f6' },
    'Community Access': { icon: '👥', color: '#10b981' },
    'Domestic Assistance': { icon: '🧹', color: '#8b5cf6' },
    'Transport': { icon: '🚗', color: '#f59e0b' },
    'Social Support': { icon: '🤝', color: '#ec4899' },
    'Skill Development': { icon: '📚', color: '#14b8a6' },
    'Therapy Support': { icon: '💆', color: '#f97316' },
    'Nursing Care': { icon: '⚕️', color: '#ef4444' },
    'Overnight Support': { icon: '🌙', color: '#6366f1' },
    'Group Activities': { icon: '🎉', color: '#84cc16' },
    'Respite Care': { icon: '☕', color: '#a855f7' },
    'Meal Preparation': { icon: '🍽️', color: '#06b6d4' },
    'Assistance with Daily Living': { icon: '🛟', color: '#64748b' },
    'SIL House Implementation': { icon: '🏡', color: '#4c0519' },
}
