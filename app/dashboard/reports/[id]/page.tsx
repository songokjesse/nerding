import { getReport } from "@/app/actions/reports";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ReportDetail } from "./report-detail";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ReportPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    const report = await getReport(id);

    if (!report) {
        notFound();
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/reports">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold">Back to Reports</h1>
            </div>
            <ReportDetail report={report} />
        </div>
    );
}
