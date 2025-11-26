import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
    // Authenticate request
    const { context, error } = await authenticateRequest(request)
    if (error) return error

    try {
        let body = {}
        try {
            body = await request.json()
        } catch (e) {
            console.warn('Failed to parse request body, assuming empty body')
        }

        const { text } = body as { text?: string }

        if (!text) {
            return errorResponse('Text is required', 'INVALID_REQUEST', 400)
        }

        // TODO: Integrate with actual AI service (e.g., OpenAI, Anthropic, Google Vertex AI)
        // For now, we return a mock response to unblock frontend development.
        const rephrasedText = `[AI Rephrased]: ${text}`

        return successResponse({
            rephrasedText
        })

    } catch (err) {
        console.error('Error rephrasing text:', err)
        const message = err instanceof Error ? err.message : 'Failed to rephrase text'
        return errorResponse(message, 'INTERNAL_ERROR', 500)
    }
}
