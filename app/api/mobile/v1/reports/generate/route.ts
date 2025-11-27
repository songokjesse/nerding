import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import prisma from '@/lib/prisma'
import { redactPII, restorePII, redactObservationData, RedactionMap } from '@/lib/privacy-utils'

export async function POST(request: NextRequest) {
    // Authenticate request
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        const body = await request.json()
        const { clientId, organisationId, reportMonth } = body as {
            clientId?: string
            organisationId?: string
            reportMonth?: string
        }

        // Validate input
        if (!clientId || !organisationId || !reportMonth) {
            return errorResponse('Missing required fields: clientId, organisationId, reportMonth', 'INVALID_REQUEST', 400)
        }

        // Verify organization access
        if (context!.organisationId !== organisationId) {
            return errorResponse('Access denied to this organization', 'FORBIDDEN', 403)
        }

        // Parse report month
        const monthDate = new Date(reportMonth)
        if (isNaN(monthDate.getTime())) {
            return errorResponse('Invalid reportMonth format', 'INVALID_REQUEST', 400)
        }

        // Calculate month range
        const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
        const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59)

        // Fetch client details
        const client = await prisma.client.findFirst({
            where: {
                id: clientId,
                organisationId
            }
        })

        if (!client) {
            return errorResponse('Client not found', 'NOT_FOUND', 404)
        }

        // Fetch all progress notes for the month
        const progressNotes = await prisma.progressNote.findMany({
            where: {
                clientId,
                organisationId,
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            },
            include: {
                author: {
                    select: {
                        name: true
                    }
                },
                shift: {
                    select: {
                        startTime: true,
                        endTime: true,
                        serviceType: true
                    }
                },
                observations: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        if (progressNotes.length === 0) {
            return errorResponse('No progress notes found for the specified month', 'NOT_FOUND', 404)
        }

        // Calculate metrics
        const totalShifts = new Set(progressNotes.map(note => note.shiftId)).size
        const totalNotes = progressNotes.length
        const totalObservations = progressNotes.reduce((sum, note) => sum + note.observations.length, 0)
        const flaggedIncidents = progressNotes.filter(note => note.incidentFlag).length
        const behaviorFlags = progressNotes.filter(note => note.behavioursFlag).length
        const medicationFlags = progressNotes.filter(note => note.medicationFlag).length

        // Count observations by type
        const observationBreakdown: Record<string, number> = {}
        progressNotes.forEach(note => {
            note.observations.forEach(obs => {
                observationBreakdown[obs.type] = (observationBreakdown[obs.type] || 0) + 1
            })
        })

        // Prepare context for redaction
        const workerNames = [...new Set(progressNotes.map(note => note.author.name))]
        const redactionContext = {
            clientName: client.name,
            ndisNumber: client.ndisNumber || undefined,
            workerNames
        }

        // Redact all progress notes
        const combinedRedactionMap: RedactionMap = {}
        const redactedNotes = progressNotes.map(note => {
            const { redactedText, redactionMap } = redactPII(note.noteText, redactionContext)
            Object.assign(combinedRedactionMap, redactionMap)
            return {
                date: note.createdAt.toISOString().split('T')[0],
                text: redactedText,
                mood: note.mood,
                incidentFlag: note.incidentFlag,
                behavioursFlag: note.behavioursFlag,
                medicationFlag: note.medicationFlag,
                serviceType: note.shift.serviceType
            }
        })

        // Redact observations
        const redactedObservations = progressNotes.flatMap(note =>
            note.observations.map(obs => {
                const { redactedData, redactionMap } = redactObservationData(obs.data, redactionContext)
                Object.assign(combinedRedactionMap, redactionMap)
                return {
                    type: obs.type,
                    data: redactedData,
                    recordedAt: obs.recordedAt.toISOString().split('T')[0]
                }
            })
        )

        // Check if AI service is configured
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set')
            return errorResponse('AI service not configured', 'CONFIG_ERROR', 503)
        }

        // Generate AI report
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const prompt = `You are a professional disability support coordinator writing a monthly progress report. Based on the following data, create a comprehensive, professional monthly report.

**IMPORTANT PRIVACY NOTE**: All personally identifiable information has been redacted and replaced with placeholders like [CLIENT_NAME], [WORKER_1], [DATE_1], etc. Use these placeholders in your report - they will be restored automatically.

**Report Month**: ${monthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}

**Statistics**:
- Total shifts: ${totalShifts}
- Total progress notes: ${totalNotes}
- Total observations: ${totalObservations}
- Incident flags: ${flaggedIncidents}
- Behavior flags: ${behaviorFlags}
- Medication flags: ${medicationFlags}

**Observation Types**:
${Object.entries(observationBreakdown).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

**Progress Notes**:
${redactedNotes.map((note, i) => `
Note ${i + 1} (${note.date}):
${note.text}
${note.mood ? `Mood: ${note.mood}` : ''}
${note.incidentFlag ? 'FLAG: Incident' : ''}
${note.behavioursFlag ? 'FLAG: Behavior concern' : ''}
${note.medicationFlag ? 'FLAG: Medication related' : ''}
${note.serviceType ? `Service: ${note.serviceType}` : ''}
`).join('\n---\n')}

**Observations**:
${redactedObservations.length > 0 ? redactedObservations.map((obs, i) => `
Observation ${i + 1} (${obs.recordedAt}):
Type: ${obs.type}
Data: ${JSON.stringify(obs.data, null, 2)}
`).join('\n---\n') : 'No observations recorded this month.'}

**Instructions**:
1. Write a professional executive summary (2-3 paragraphs)
2. Highlight key achievements and milestones
3. Identify any patterns in behavior, mood, or health
4. Summarize medical observations if present
5. Note any incidents or concerns that require attention
6. Provide recommendations for continued support
7. Use the placeholders ([CLIENT_NAME], [WORKER_1], etc.) as they appear - do not replace them
8. Be objective, clinical, and professional in tone
9. Structure the report with clear sections using markdown headers (##)

Write the complete monthly report now:`

        const result = await model.generateContent(prompt)
        const response = await result.response
        let generatedReport = response.text().trim()

        // Restore PII in the generated report
        generatedReport = restorePII(generatedReport, combinedRedactionMap)

        // Prepare metrics
        const metricsJson = {
            totalShifts,
            totalNotes,
            totalObservations,
            observationBreakdown,
            flaggedIncidents,
            behaviorFlags,
            medicationFlags,
            reportMonth: monthDate.toISOString()
        }

        return successResponse({
            summaryText: generatedReport,
            metricsJson
        })

    } catch (err) {
        console.error('Error generating AI report:', err)
        const message = err instanceof Error ? err.message : 'Failed to generate report'
        return errorResponse(message, 'INTERNAL_ERROR', 500)
    }
}
