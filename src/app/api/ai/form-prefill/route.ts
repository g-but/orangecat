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
import { ApiResponses } from '@/lib/api/responses';
import { generateFormPrefill } from '@/lib/ai/form-prefill-service';
import { getEntityConfig } from '@/config/entity-configs/get-config';
import { isValidEntityType, type EntityType } from '@/config/entity-registry';
import { logger } from '@/utils/logger';

// Rate limiting - track requests per user
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // 5 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms

/**
 * Check and update rate limit for a user
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

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
  const userId = req.user.id;

  // Check rate limit
  if (!checkRateLimit(userId)) {
    logger.warn('Rate limit exceeded for AI form prefill', { userId }, 'AI');
    return ApiResponses.rateLimitExceeded(
      'Too many AI requests. Please wait a minute before trying again.'
    );
  }

  try {
    // Parse and validate request body
    const body = await req.json();
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      return ApiResponses.validationError(
        'Invalid request',
        parseResult.error.flatten().fieldErrors
      );
    }

    const { entityType, description, existingData } = parseResult.data;

    // Validate entity type
    if (!isValidEntityType(entityType)) {
      return ApiResponses.badRequest(`Invalid entity type: ${entityType}`);
    }

    // Get entity configuration
    const entityConfig = getEntityConfig(entityType as EntityType);
    if (!entityConfig) {
      return ApiResponses.badRequest(`No configuration found for entity type: ${entityType}`);
    }

    logger.info(
      'AI form prefill request',
      {
        userId,
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
          userId,
          entityType,
          error: result.error,
        },
        'AI'
      );

      return ApiResponses.badRequest(result.error || 'Failed to generate form data');
    }

    logger.info(
      'AI form prefill success',
      {
        userId,
        entityType,
        fieldsGenerated: Object.keys(result.data).length,
      },
      'AI'
    );

    return ApiResponses.success({
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

    return ApiResponses.internalServerError(
      'An unexpected error occurred while generating form data'
    );
  }
});
