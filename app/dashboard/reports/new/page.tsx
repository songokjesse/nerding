import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CreateReportForm } from "./report-form";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function NewReportPage() {
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

    const clients = await prisma.client.findMany({
        where: {
            organisationId,
        },
        orderBy: {
            name: "asc",
        },
    });

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/reports">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold">Create New Report</h1>
            </div>
            <div className="w-full max-w-4xl">
                <CreateReportForm clients={clients} organisationId={organisationId} />
            </div>
        </div>
    );
}
