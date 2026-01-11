/**
 * API Key Validation Endpoint
 *
 * POST - Validate an API key without saving it
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createApiKeyService } from '@/services/ai/api-key-service';
import { z } from 'zod';

const validateSchema = z.object({
  apiKey: z.string().min(10).max(500),
});

/**
 * POST /api/user/api-keys/validate
 * Validate an API key without saving
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = validateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { apiKey } = result.data;

    const keyService = createApiKeyService(supabase);
    const validation = await keyService.validateKeyWithProvider(apiKey);

    return NextResponse.json({
      success: true,
      data: {
        isValid: validation.isValid,
        error: validation.error,
        rateLimits: validation.rateLimits,
      },
    });
  } catch (error) {
    console.error('Error validating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
