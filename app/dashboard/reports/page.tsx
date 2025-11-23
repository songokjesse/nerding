import { getReports } from "@/app/actions/reports";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReportsTable } from "./reports-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import prisma from "@/lib/prisma";

export default async function ReportsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    const membership = await prisma.organisationMember.findFirst({
        where: {
            userId: session.user.id,
        },
    });

    const organisationId = membership?.organisationId;

    if (!organisationId) {
        return <div>No organisation found</div>;
    }

    const reports = await getReports({ organisationId });

    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Monthly Reports</h1>
                <Button asChild>
                    <Link href="/dashboard/reports/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Report
                    </Link>
                </Button>
            </div>
            <ReportsTable reports={reports} />
        </div>
    );
}
