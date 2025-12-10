import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { userAIAssistantSchema, type UserAIAssistantFormData } from '@/lib/validation';
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiInternalError,
  handleApiError,
  handleSupabaseError,
} from '@/lib/api/standardResponse';
import { rateLimit, rateLimitWrite, createRateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { apiRateLimited } from '@/lib/api/standardResponse';

// GET /api/ai-assistants - Get user's AI assistants
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // Rate limiting check
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const { data: assistants, error } = await supabase
      .from('user_ai_assistants')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return apiInternalError('Failed to fetch AI assistants', { details: error.message });
    }

    return apiSuccess(assistants);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/ai-assistants - Create new AI assistant
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // Rate limiting check - 10 writes per minute per user
    const rateLimitResult = rateLimitWrite(user.id);
    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      logger.warn('AI assistant creation rate limit exceeded', { userId: user.id });
      return apiRateLimited('Too many AI assistant creation requests. Please slow down.', retryAfter);
    }

    const body = await request.json();
    const validatedData = userAIAssistantSchema.parse(body);

    const insertPayload = {
      user_id: user.id,
      assistant_name: validatedData.assistant_name ?? 'My Cat',
      personality_prompt: validatedData.personality_prompt,
      training_data: validatedData.training_data ?? {},
      status: validatedData.status ?? 'coming_soon',
      is_enabled: validatedData.is_enabled ?? false,
      response_style: validatedData.response_style ?? 'friendly',
      allowed_topics: validatedData.allowed_topics ?? [],
      blocked_topics: validatedData.blocked_topics ?? [],
    };

    const { data: assistant, error } = await supabase
      .from('user_ai_assistants')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      logger.error('AI assistant creation failed', {
        userId: user.id,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('AI assistant created successfully', { userId: user.id, assistantId: assistant.id });
    return apiSuccess(assistant, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return apiValidationError('Invalid AI assistant data', {
        details: zodError.errors || zodError.message,
      });
    }
    return handleApiError(error);
  }
}




























