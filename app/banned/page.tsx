import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function BannedPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                    Your account has been suspended by an administrator.
                </p>
                <div className="pt-4">
                    <Link href="/sign-in">
                        <Button variant="outline">Back to Sign In</Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
