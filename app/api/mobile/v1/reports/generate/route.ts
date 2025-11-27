import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import { generateAIReportLogic } from '@/lib/generate-ai-report'

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

        // Generate the report using shared logic
        const result = await generateAIReportLogic({
            clientId,
            organisationId,
            reportMonth: monthDate
        })

        return successResponse(result)

    } catch (err) {
        console.error('Error generating AI report:', err)
        const message = err instanceof Error ? err.message : 'Failed to generate report'
        return errorResponse(message, 'INTERNAL_ERROR', 500)
    }
}
