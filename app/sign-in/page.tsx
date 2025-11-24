"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "@/lib/auth-client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const formSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(1, {
        message: "Password is required.",
    }),
})

export default function SignIn() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (isLoading) return // Prevent double-click

        setIsLoading(true)
        setError(null)

        try {
            const res = await signIn.email({
                email: values.email,
                password: values.password,
            })

            if (res.error) {
                setError(res.error.message || "Something went wrong.")
            } else {
                router.push("/dashboard")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center p-6">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Sign In</CardTitle>
                    <CardDescription>Welcome back! Please sign in to continue.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="m@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="******" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Signing in..." : "Sign In"}
                            </Button>
                        </form>
                    </Form>
                    {error && <p className="mt-4 text-sm text-red-500 text-center">{error}</p>}
                </CardContent>
            </Card>
        </main>
    )
}