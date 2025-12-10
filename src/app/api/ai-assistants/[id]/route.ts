import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { userAIAssistantSchema, type UserAIAssistantFormData } from '@/lib/validation';
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
  apiInternalError,
  handleApiError,
  handleSupabaseError,
} from '@/lib/api/standardResponse';
import { rateLimit, rateLimitWrite, createRateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { apiRateLimited } from '@/lib/api/standardResponse';

// GET /api/ai-assistants/[id] - Get specific AI assistant
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const assistantId = params.id;

    const { data: assistant, error } = await supabase
      .from('user_ai_assistants')
      .select('*')
      .eq('id', assistantId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return apiNotFound('AI assistant not found');
      }
      return apiInternalError('Failed to fetch AI assistant', { details: error.message });
    }

    return apiSuccess(assistant);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/ai-assistants/[id] - Update AI assistant
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const assistantId = params.id;

    // Check if assistant exists and belongs to user
    const { data: existingAssistant, error: fetchError } = await supabase
      .from('user_ai_assistants')
      .select('user_id')
      .eq('id', assistantId)
      .single();

    if (fetchError || !existingAssistant) {
      return apiNotFound('AI assistant not found');
    }

    if (existingAssistant.user_id !== user.id) {
      return apiUnauthorized('You can only update your own AI assistants');
    }

    // Rate limiting check
    const rateLimitResult = rateLimitWrite(user.id);
    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many update requests. Please slow down.', retryAfter);
    }

    const body = await request.json();
    const validatedData = userAIAssistantSchema.parse(body);

    const updatePayload = {
      assistant_name: validatedData.assistant_name ?? 'My Cat',
      personality_prompt: validatedData.personality_prompt,
      training_data: validatedData.training_data ?? {},
      status: validatedData.status ?? 'coming_soon',
      is_enabled: validatedData.is_enabled ?? false,
      response_style: validatedData.response_style ?? 'friendly',
      allowed_topics: validatedData.allowed_topics ?? [],
      blocked_topics: validatedData.blocked_topics ?? [],
      updated_at: new Date().toISOString(),
    };

    const { data: assistant, error } = await supabase
      .from('user_ai_assistants')
      .update(updatePayload)
      .eq('id', assistantId)
      .select('*')
      .single();

    if (error) {
      logger.error('AI assistant update failed', {
        userId: user.id,
        assistantId,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('AI assistant updated successfully', { userId: user.id, assistantId });
    return apiSuccess(assistant);
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

// DELETE /api/ai-assistants/[id] - Delete AI assistant
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const assistantId = params.id;

    // Check if assistant exists and belongs to user
    const { data: existingAssistant, error: fetchError } = await supabase
      .from('user_ai_assistants')
      .select('user_id, assistant_name')
      .eq('id', assistantId)
      .single();

    if (fetchError || !existingAssistant) {
      return apiNotFound('AI assistant not found');
    }

    if (existingAssistant.user_id !== user.id) {
      return apiUnauthorized('You can only delete your own AI assistants');
    }

    const { error } = await supabase
      .from('user_ai_assistants')
      .delete()
      .eq('id', assistantId);

    if (error) {
      logger.error('AI assistant deletion failed', {
        userId: user.id,
        assistantId,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('AI assistant deleted successfully', { userId: user.id, assistantId });
    return apiSuccess({ message: 'AI assistant deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}




























