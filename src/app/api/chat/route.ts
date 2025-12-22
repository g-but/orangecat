import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit';

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Use the cheapest model: Gemini 2.0 Flash-Lite
const MODEL_NAME = 'gemini-2.0-flash-lite';

// POST /api/chat - Send a message to the LLM and get response
export async function POST(request: NextRequest) {
  // Rate limiting: Use existing rate limiter with custom key for stricter LLM limits
  // Note: In production, consider creating a dedicated rate limiter for expensive operations
  const rateLimitResult = rateLimit(request);
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    // Parse the request body
    const body = await request.json();
    const { message, systemPrompt } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'Message is required and must be a string' }, { status: 400 });
    }

    if (message.length > 10000) {
      return Response.json({ error: 'Message too long (max 10,000 characters)' }, { status: 400 });
    }

    // Get the model
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    // Prepare the prompt
    let prompt = message;

    // Add system prompt if provided
    if (systemPrompt && typeof systemPrompt === 'string') {
      prompt = `${systemPrompt}\n\nUser: ${message}`;
    }

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Check if response was blocked
    if (!text || text.trim().length === 0) {
      return Response.json({ error: 'No response generated' }, { status: 500 });
    }

    // Return the response
    return Response.json({
      message: text.trim(),
      model: MODEL_NAME,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat API error:', error);

    // Handle specific Gemini API errors
    if (error instanceof Error) {
      if (error.message.includes('API_KEY_INVALID')) {
        return Response.json({ error: 'Invalid API key' }, { status: 401 });
      }

      if (error.message.includes('QUOTA_EXCEEDED')) {
        return Response.json({ error: 'API quota exceeded' }, { status: 429 });
      }

      if (error.message.includes('SAFETY')) {
        return Response.json({ error: 'Content blocked by safety filters' }, { status: 400 });
      }
    }

    // Generic error
    return Response.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}

// GET /api/chat - Health check for the chat endpoint
export async function GET() {
  return Response.json({
    status: 'healthy',
    model: MODEL_NAME,
    provider: 'Google Gemini',
    pricing: {
      input: '$0.075 per 1M tokens',
      output: '$0.30 per 1M tokens',
    },
    timestamp: new Date().toISOString(),
  });
}
