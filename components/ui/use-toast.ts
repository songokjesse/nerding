export const useToast = () => ({
    toast: ({ title, description, variant }: any) => {
        console.log(`Toast: ${title} - ${description} (${variant})`)
        if (variant === 'destructive') {
            // Fallback for error visibility
            // alert(`${title}: ${description}`)
        }
    }
})
