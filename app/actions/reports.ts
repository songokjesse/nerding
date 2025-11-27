"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";


export async function getReports({
  organisationId,
  clientId,
  month,
}: {
  organisationId: string;
  clientId?: string;
  month?: Date;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const where: any = {
    organisationId,
  };

  if (clientId) {
    where.clientId = clientId;
  }

  if (month) {
    // Filter by month (ignoring time)
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    where.reportMonth = {
      gte: startOfMonth,
      lte: endOfMonth,
    };
  }

  const reports = await prisma.monthlyReport.findMany({
    where,
    include: {
      client: true,
      createdBy: true,
      reviewedBy: true,
    },
    orderBy: {
      reportMonth: "desc",
    },
  });

  return reports;
}

export async function getReport(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const report = await prisma.monthlyReport.findUnique({
    where: { id },
    include: {
      client: true,
      createdBy: true,
      reviewedBy: true,
    },
  });

  return report;
}

export async function createReport(data: {
  organisationId: string;
  clientId: string;
  reportMonth: Date;
  summaryText: string;
  metricsJson?: any;
  generatedByAI?: boolean;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const report = await prisma.monthlyReport.create({
    data: {
      ...data,
      createdById: session.user.id,
    },
  });

  revalidatePath("/dashboard/reports");
  return report;
}

export async function updateReport(
  id: string,
  data: {
    summaryText?: string;
    metricsJson?: any;
    reviewedById?: string;
  }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const report = await prisma.monthlyReport.update({
    where: { id },
    data,
  });

  revalidatePath("/dashboard/reports");
  revalidatePath(`/dashboard/reports/${id}`);
  return report;
}

export async function generateAIReport(data: {
  clientId: string;
  organisationId: string;
  reportMonth: Date;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Call the AI generation API endpoint
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/mobile/v1/reports/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': (await headers()).get('cookie') || ''
    },
    body: JSON.stringify({
      clientId: data.clientId,
      organisationId: data.organisationId,
      reportMonth: data.reportMonth.toISOString()
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate AI report');
  }

  const result = await response.json();
  return result;
}
