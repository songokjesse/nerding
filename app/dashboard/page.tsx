"use client"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Navbar } from "@/components/dashboard/navbar"
import { useEffect } from "react";

export default function DashboardPage() {
    const router = useRouter()
    const { data: session, isPending } = useSession()
    useEffect(() => {
        if (!isPending && !session?.user) {
            router.push("/sign-in");
        }
    }, [isPending, session, router]);
    if (isPending)
        return <p className="text-center mt-8 text-white">Loading...</p>;
    if (!session?.user)
        return <p className="text-center mt-8 text-white">Redirecting...</p>;
    const { user } = session;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar user={user} />
            <main className="p-6">
                <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <p className="text-lg">Welcome, {user.name || "User"}!</p>
                    <p className="text-gray-500 dark:text-gray-400">Email: {user.email}</p>
                </div>
            </main>
        </div>
    )
}
