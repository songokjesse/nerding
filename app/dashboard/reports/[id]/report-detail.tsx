"use client";

// import { MonthlyReport, Client, User } from "@/generated/prisma/client/models";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateReport } from "@/app/actions/reports";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
// import { toast } from "sonner";

type ReportWithRelations = any;

export function ReportDetail({ report }: { report: ReportWithRelations }) {
    const [isEditing, setIsEditing] = useState(false);
    const [summary, setSummary] = useState(report.summaryText);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        if (isSaving) return; // Prevent double-click

        setIsSaving(true);
        try {
            await updateReport(report.id, {
                summaryText: summary,
            });
            setIsEditing(false);
            // toast.success("Report updated successfully");
            router.refresh();
        } catch (error) {
            console.error(error);
            // toast.error("Failed to update report");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        Report for {report.client.name}
                    </h1>
                    <p className="text-muted-foreground">
                        {format(new Date(report.reportMonth), "MMMM yyyy")}
                    </p>
                </div>
                <Button
                    variant={isEditing ? "outline" : "default"}
                    onClick={() => {
                        if (isEditing) {
                            setIsEditing(false);
                            setSummary(report.summaryText);
                        } else {
                            setIsEditing(true);
                        }
                    }}
                >
                    {isEditing ? "Cancel" : "Edit Report"}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                        <h2 className="mb-2 text-lg font-semibold">Summary</h2>
                        {isEditing ? (
                            <div className="space-y-4">
                                <Textarea
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    className="min-h-[200px]"
                                />
                                <div className="flex justify-end">
                                    <Button onClick={handleSave} disabled={isSaving}>
                                        {isSaving && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="whitespace-pre-wrap">{report.summaryText}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                        <h2 className="mb-2 text-lg font-semibold">Details</h2>
                        <dl className="grid gap-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Created By</dt>
                                <dd>{report.createdBy?.name || "Unknown"}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Created At</dt>
                                <dd>{format(new Date(report.createdAt), "PPP")}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Reviewed By</dt>
                                <dd>{report.reviewedBy?.name || "Not reviewed"}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">AI Generated</dt>
                                <dd>{report.generatedByAI ? "Yes" : "No"}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
