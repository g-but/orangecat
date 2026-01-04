import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { compose } from '@/lib/api/compose';
import { withRequestId } from '@/lib/api/withRequestId';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withZodBody } from '@/lib/api/withZod';
import {
  apiSuccess,
  apiValidationError,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Use the cheapest model: Gemini 2.0 Flash-Lite
const MODEL_NAME = 'gemini-2.0-flash-lite';

// Validation schema
const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000, 'Message too long (max 10,000 characters)'),
  systemPrompt: z.string().max(5000).optional(),
});

// POST /api/chat - Send a message to the LLM and get response
export const POST = compose(
  withRequestId(),
  withRateLimit('read'), // LLM calls are expensive, use read rate limit
  withZodBody(chatRequestSchema)
)(async (request: NextRequest, ctx) => {
  try {
    const { message, systemPrompt } = ctx.body;

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
      logger.error('Chat API: No response generated', {}, 'Chat');
      return handleApiError(new Error('No response generated'));
    }

    // Return the response
    return apiSuccess({
      message: text.trim(),
      model: MODEL_NAME,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Chat API error', { error }, 'Chat');

    // Handle specific Gemini API errors
    if (error instanceof Error) {
      if (error.message.includes('API_KEY_INVALID')) {
        return handleApiError(new Error('Invalid API key'));
      }

      if (error.message.includes('QUOTA_EXCEEDED')) {
        return apiRateLimited('API quota exceeded');
      }

      if (error.message.includes('SAFETY')) {
        return apiValidationError('Content blocked by safety filters');
      }
    }

    return handleApiError(error);
  }
});

// GET /api/chat - Health check for the chat endpoint
export const GET = compose(
  withRequestId(),
  withRateLimit('read')
)(async () => {
  return apiSuccess({
    status: 'healthy',
    model: MODEL_NAME,
    provider: 'Google Gemini',
    pricing: {
      input: '$0.075 per 1M tokens',
      output: '$0.30 per 1M tokens',
    },
    timestamp: new Date().toISOString(),
  });
});

