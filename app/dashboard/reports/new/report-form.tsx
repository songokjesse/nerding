"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createReport } from "@/app/actions/reports";
import { Loader2 } from "lucide-react";

export function CreateReportForm({
    clients,
    organisationId,
}: {
    clients: any[];
    organisationId: string;
}) {
    const [clientId, setClientId] = useState("");
    const [month, setMonth] = useState("");
    const [summary, setSummary] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId || !month || !summary) return;

        setIsSubmitting(true);
        try {
            await createReport({
                organisationId,
                clientId,
                reportMonth: new Date(month),
                summaryText: summary,
            });
            router.push("/dashboard/reports");
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to create report");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                        {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                                {client.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Input
                    id="month"
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Enter report summary..."
                    required
                    className="min-h-[150px]"
                />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Report
            </Button>
        </form>
    );
}
