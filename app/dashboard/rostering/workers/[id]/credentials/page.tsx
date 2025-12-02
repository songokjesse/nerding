import { Suspense } from "react"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { WorkerCredentialsClient } from "./client"

interface PageProps {
    params: { id: string }
}

async function getWorkerWithCredentials(workerId: string) {
    const worker = await prisma.user.findUnique({
        where: { id: workerId },
        include: {
            workerCredentials: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    return worker
}

export default async function WorkerCredentialsPage({ params }: PageProps) {
    const worker = await getWorkerWithCredentials(params.id)

    if (!worker) {
        notFound()
    }

    const credentials = worker.workerCredentials.map(c => ({
        id: c.id,
        type: c.type,
        issueDate: c.issueDate.toISOString(),
        expiryDate: c.expiryDate?.toISOString() || null,
        documentUrl: c.documentUrl,
        verified: c.verified
    }))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Worker Credentials</h1>
                <p className="text-muted-foreground">
                    Manage credentials and certifications for {worker.name}
                </p>
            </div>

            <Suspense fallback={<div>Loading...</div>}>
                <WorkerCredentialsClient
                    workerId={worker.id}
                    workerName={worker.name}
                    initialCredentials={credentials}
                />
            </Suspense>
        </div>
    )
}
