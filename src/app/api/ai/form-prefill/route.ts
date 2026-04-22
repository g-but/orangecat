/**
 * AI Form Prefill API Endpoint
 *
 * Generates form field values from natural language descriptions using AI.
 * Used by the entity creation forms to prefill fields based on user descriptions.
 *
 * POST /api/ai/form-prefill
 *
 * Created: 2025-01-20
 */

import { z } from 'zod';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiBadRequest,
  apiValidationError,
  apiRateLimited,
  apiInternalError,
} from '@/lib/api/standardResponse';
import { NextResponse } from 'next/server';
import { generateFormPrefill } from '@/lib/ai/form-prefill-service';
import { getEntityConfig } from '@/config/entity-configs/get-config';
import { isValidEntityType, type EntityType } from '@/config/entity-registry';
import { logger } from '@/utils/logger';
import { rateLimitWriteAsync } from '@/lib/rate-limit';

/**
 * Request validation schema
 */
const requestSchema = z.object({
  entityType: z.string().min(1, 'Entity type is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  existingData: z.record(z.unknown()).optional(),
});

/**
 * POST /api/ai/form-prefill
 *
 * Generate form field values from a natural language description.
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const { user } = req;

  const rl = await rateLimitWriteAsync(user.id);
  if (!rl.success) {
    const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
    logger.warn('Rate limit exceeded for AI form prefill', { userId: user.id }, 'AI');
    return apiRateLimited('Too many requests. Please slow down.', retryAfter);
  }

  try {
    // Parse and validate request body
    const body = await req.json();
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      return apiValidationError('Invalid request', parseResult.error.flatten().fieldErrors);
    }

    const { entityType, description, existingData } = parseResult.data;

    // Validate entity type
    if (!isValidEntityType(entityType)) {
      return apiBadRequest(`Invalid entity type: ${entityType}`);
    }

    // Get entity configuration
    const entityConfig = getEntityConfig(entityType as EntityType);
    if (!entityConfig) {
      return apiBadRequest(`No configuration found for entity type: ${entityType}`);
    }

    logger.info(
      'AI form prefill request',
      {
        userId: user.id,
        entityType,
        descriptionLength: description.length,
      },
      'AI'
    );

    // Generate form prefill using AI
    const result = await generateFormPrefill(entityType, description, entityConfig, existingData);

    if (!result.success) {
      logger.warn(
        'AI form prefill failed',
        {
          userId: user.id,
          entityType,
          error: result.error,
        },
        'AI'
      );

      return apiBadRequest(result.error || 'Failed to generate form data');
    }

    logger.info(
      'AI form prefill success',
      {
        userId: user.id,
        entityType,
        fieldsGenerated: Object.keys(result.data).length,
      },
      'AI'
    );

    // Return flat structure — AIPrefillBar reads result.data and result.confidence directly
    return NextResponse.json({
      success: true,
      data: result.data,
      confidence: result.confidence,
    });
  } catch (error) {
    logger.error(
      'AI form prefill error',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      'AI'
    );

    return apiInternalError('An unexpected error occurred while generating form data');
  }
});
