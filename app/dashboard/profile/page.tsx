"use client"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Navbar } from "@/components/dashboard/navbar"
import { ProfileForm } from "@/components/dashboard/profile-form"
import { PasswordForm } from "@/components/dashboard/password-form"
import { useEffect } from "react";

export default function ProfilePage() {
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
            <main className="max-w-2xl mx-auto p-6 space-y-8">
                <h1 className="text-2xl font-bold mb-4">Profile Settings</h1>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <ProfileForm user={user} />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <PasswordForm />
                </div>
            </main>
        </div>
    )
}
