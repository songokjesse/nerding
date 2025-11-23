"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// import { MonthlyReport, Client, User } from "@/generated/prisma/client/models";

type ReportWithRelations = any;

export function ReportsTable({ reports }: { reports: ReportWithRelations[] }) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Reviewed By</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reports.map((report) => (
                        <TableRow key={report.id}>
                            <TableCell>{report.client.name}</TableCell>
                            <TableCell>{format(new Date(report.reportMonth), "MMMM yyyy")}</TableCell>
                            <TableCell>{report.createdBy?.name || "Unknown"}</TableCell>
                            <TableCell>{report.reviewedBy?.name || "-"}</TableCell>
                            <TableCell>
                                <Button asChild variant="ghost" size="sm">
                                    <Link href={`/dashboard/reports/${report.id}`}>View</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {reports.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">
                                No reports found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
