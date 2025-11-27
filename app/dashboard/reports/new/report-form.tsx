"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createReport, generateAIReport } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Loader2,
    Sparkles,
    Shield,
    BarChart3,
    Check,
    ChevronsUpDown,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Client {
    id: string;
    name: string;
}

interface CreateReportFormProps {
    clients: Client[];
    organisationId: string;
}

export function CreateReportForm({
    clients,
    organisationId,
}: CreateReportFormProps) {
    const router = useRouter();
    const [clientId, setClientId] = useState("");
    const [open, setOpen] = useState(false);
    const [month, setMonth] = useState("");
    const [summary, setSummary] = useState("");
    const [metrics, setMetrics] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [isAIGenerated, setIsAIGenerated] = useState(false);

    const handleGenerateAI = async () => {
        if (!clientId || !month) {
            setGenerationError("Please select a client and month first");
            return;
        }

        setIsGenerating(true);
        setGenerationError(null);

        try {
            const result = await generateAIReport({
                clientId,
                organisationId,
                reportMonth: new Date(month),
            });

            setSummary(result.summaryText);
            setMetrics(result.metricsJson);
            setIsAIGenerated(true);
        } catch (error) {
            console.error(error);
            setGenerationError(
                error instanceof Error ? error.message : "Failed to generate AI report"
            );
        } finally {
            setIsGenerating(false);
        }
    };

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
                metricsJson: metrics,
                generatedByAI: isAIGenerated,
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
        <div className="space-y-6">
            {/* Privacy Notice */}
            <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                    <strong>Privacy Protected:</strong> When using AI generation, all personally
                    identifiable information (names, NDIS numbers, dates, locations) is
                    automatically redacted before processing and restored in the final report.
                    No sensitive data is sent to external AI services.
                </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2 flex flex-col">
                        <Label htmlFor="client">Client</Label>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="w-full justify-between"
                                >
                                    {clientId
                                        ? clients.find((client) => client.id === clientId)?.name
                                        : "Select a client..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search client..." />
                                    <CommandList>
                                        <CommandEmpty>No client found.</CommandEmpty>
                                        <CommandGroup>
                                            {clients.map((client) => (
                                                <CommandItem
                                                    key={client.id}
                                                    value={client.name}
                                                    onSelect={() => {
                                                        setClientId(client.id === clientId ? "" : client.id)
                                                        setOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            clientId === client.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {client.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
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
                </div>

                {/* AI Generation Section */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Report Summary</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateAI}
                            disabled={isGenerating || !clientId || !month}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    {summary ? "Regenerate with AI" : "Generate with AI"}
                                </>
                            )}
                        </Button>
                    </div>

                    {generationError && (
                        <Alert variant="destructive">
                            <AlertDescription>{generationError}</AlertDescription>
                        </Alert>
                    )}

                    <Textarea
                        id="summary"
                        value={summary}
                        onChange={(e) => {
                            setSummary(e.target.value);
                            setIsAIGenerated(false); // Mark as manually edited
                        }}
                        placeholder="Enter report summary manually or generate with AI..."
                        required
                        className="min-h-[300px] font-mono text-sm"
                    />
                    {isAIGenerated && summary && (
                        <p className="text-xs text-muted-foreground">
                            ✨ AI-generated content (editable)
                        </p>
                    )}
                </div>

                {/* Metrics Display */}
                {metrics && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Report Metrics
                            </CardTitle>
                            <CardDescription>
                                Statistics from progress notes and observations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Shifts</p>
                                    <p className="text-2xl font-bold">{metrics.totalShifts}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Progress Notes</p>
                                    <p className="text-2xl font-bold">{metrics.totalNotes}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Observations</p>
                                    <p className="text-2xl font-bold">{metrics.totalObservations}</p>
                                </div>
                                {metrics.flaggedIncidents > 0 && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Incidents</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {metrics.flaggedIncidents}
                                        </p>
                                    </div>
                                )}
                                {metrics.behaviorFlags > 0 && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Behavior Flags</p>
                                        <p className="text-2xl font-bold text-orange-600">
                                            {metrics.behaviorFlags}
                                        </p>
                                    </div>
                                )}
                                {metrics.medicationFlags > 0 && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Medication Flags</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {metrics.medicationFlags}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {metrics.observationBreakdown && Object.keys(metrics.observationBreakdown).length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-sm font-medium mb-2">Observation Breakdown</p>
                                    <div className="space-y-1">
                                        {Object.entries(metrics.observationBreakdown).map(([type, count]) => (
                                            <div key={type} className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    {type.replace(/_/g, ' ')}
                                                </span>
                                                <span className="font-medium">{count as number}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Report
                </Button>
            </form>
        </div>
    );
}
