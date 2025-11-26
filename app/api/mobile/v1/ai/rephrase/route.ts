import { NextRequest } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api-auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set')
            return errorResponse('AI service not configured', 'CONFIG_ERROR', 503)
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-002' })

        const prompt = `Rephrase the following text to be more professional, objective, and clinically appropriate for a disability support progress note. Keep the meaning exactly the same, but improve the tone and grammar. Do not add any introductory or concluding text, just return the rephrased text.

Original text: "${text}"`

        const result = await model.generateContent(prompt)
        const response = await result.response
        const rephrasedText = response.text().trim()

        return successResponse({
            rephrasedText
        })

    } catch (err) {
        console.error('Error rephrasing text:', err)
        const message = err instanceof Error ? err.message : 'Failed to rephrase text'
        return errorResponse(message, 'INTERNAL_ERROR', 500)
    }
}
