/**
 * User API Keys Management
 *
 * GET - List user's API keys
 * POST - Add a new API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createApiKeyService } from '@/services/ai/api-key-service';
import { z } from 'zod';
import { logger } from '@/utils/logger';

const addKeySchema = z.object({
  provider: z
    .enum(['openrouter', 'anthropic', 'openai', 'google', 'xai', 'groq', 'together', 'deepseek'])
    .default('openrouter'),
  keyName: z.string().min(1).max(50).default('Default'),
  apiKey: z.string().min(10).max(500),
  isPrimary: z.boolean().default(true),
});

/**
 * GET /api/user/api-keys
 * List all API keys for the current user
 */
export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keyService = createApiKeyService(supabase);
    const keys = await keyService.getKeys(user.id);

    // Also get platform usage
    const platformUsage = await keyService.checkPlatformUsage(user.id);

    return NextResponse.json({
      success: true,
      data: {
        keys,
        platformUsage,
        hasByok: keys.some(k => k.is_valid && k.is_primary),
      },
    });
  } catch (error) {
    logger.error('Error fetching API keys', error, 'ApiKeysAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/user/api-keys
 * Add a new API key
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
    const result = addKeySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { provider, keyName, apiKey, isPrimary } = result.data;

    const keyService = createApiKeyService(supabase);
    const addResult = await keyService.addKey({
      userId: user.id,
      provider,
      keyName,
      apiKey,
      isPrimary,
    });

    if (!addResult.success) {
      return NextResponse.json(
        {
          error: addResult.error || 'Failed to add API key',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: addResult.key,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error adding API key', error, 'ApiKeysAPI');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
