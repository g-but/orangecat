/**
 * Generic Profile Entity API Endpoint
 *
 * Fetches entities of any type for a user's profile page.
 * Respects show_on_profile and status filters.
 *
 * GET /api/profiles/[userId]/entities/[entityType]
 */

import { logger } from '@/utils/logger';
import { createServerClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiInternalError, apiBadRequest } from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import {
  getTableName,
  isValidEntityType,
  EntityType,
  getEntityMetadata,
} from '@/config/entity-registry';

// Entity-specific column selections for optimal queries
const ENTITY_COLUMNS: Record<EntityType, string> = {
  project:
    'id, title, description, category, tags, status, bitcoin_address, lightning_address, goal_amount, currency, raised_amount, bitcoin_balance_btc, created_at, updated_at, thumbnail_url',
  product: 'id, title, description, category, price, currency, status, images, created_at',
  service:
    'id, title, description, category, pricing_type, hourly_rate, fixed_price, currency, status, created_at',
  cause: 'id, title, description, category, goal_amount, currency, status, created_at',
  ai_assistant: 'id, title, description, category, pricing_model, status, avatar_url, created_at',
  asset:
    'id, title, description, type, estimated_value, currency, verification_status, status, created_at',
  loan: 'id, title, description, original_amount, remaining_balance, interest_rate, currency, status, created_at',
  event:
    'id, title, description, event_type, category, start_date, end_date, venue_name, venue_city, is_online, status, ticket_price, is_free, currency, created_at',
  wallet: 'id, label, wallet_type, address, is_active, created_at',
  group: 'id, name, slug, description, is_public, created_at',
  research:
    'id, title, description, field, methodology, expected_outcome, funding_goal_sats, current_funding_sats, status, created_at',
  wishlist:
    'id, title, description, type, visibility, is_active, event_date, cover_image_url, created_at',
  document: 'id, title, content, document_type, visibility, tags, created_at',
};

// Entities that should filter by user_id
const USER_ID_FIELD: Record<EntityType, string> = {
  project: 'user_id',
  product: 'user_id',
  service: 'user_id',
  cause: 'user_id',
  ai_assistant: 'user_id',
  asset: 'owner_id',
  loan: 'user_id',
  event: 'organizer_id',
  wallet: 'user_id',
  group: 'owner_id',
  research: 'user_id',
  wishlist: 'actor_id',
  document: 'actor_id',
};

// Entities that shouldn't appear on profile (e.g., groups have their own pages, documents are personal)
const EXCLUDED_ENTITY_TYPES: EntityType[] = ['wallet', 'group', 'document'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; entityType: string }> }
) {
  try {
    const { userId, entityType } = await params;

    // Validate user ID
    const idValidation = getValidationError(validateUUID(userId, 'user ID'));
    if (idValidation) {
      return idValidation;
    }

    // Validate entity type
    if (!isValidEntityType(entityType)) {
      return apiBadRequest(`Invalid entity type: ${entityType}`);
    }

    // Check if entity type is allowed on profiles
    if (EXCLUDED_ENTITY_TYPES.includes(entityType as EntityType)) {
      return apiBadRequest(`Entity type ${entityType} is not displayed on profiles`);
    }

    const supabase = await createServerClient();
    const tableName = getTableName(entityType as EntityType);
    const columns = ENTITY_COLUMNS[entityType as EntityType];
    const userIdField = USER_ID_FIELD[entityType as EntityType];

    // Build query
    let query = supabase
      .from(tableName)
      .select(columns)
      .eq(userIdField, userId)
      .neq('status', 'draft') // Exclude drafts from public profile
      .order('created_at', { ascending: false });

    // Add show_on_profile filter (exclude false, keep true and null)
    query = query.neq('show_on_profile', false);

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch profile entities', {
        userId,
        entityType,
        error: error.message,
      });
      return apiInternalError(`Failed to fetch ${entityType}s`);
    }

    const metadata = getEntityMetadata(entityType as EntityType);

    logger.info('Fetched profile entities successfully', {
      userId,
      entityType,
      count: data?.length || 0,
    });

    return apiSuccess(
      {
        data: data || [],
        entityType,
        metadata: {
          name: metadata.name,
          namePlural: metadata.namePlural,
          icon: metadata.icon.name,
          colorTheme: metadata.colorTheme,
        },
        counts: {
          total: data?.length || 0,
        },
      },
      { cache: 'SHORT' }
    );
  } catch (error) {
    logger.error('Unexpected error fetching profile entities', { error });
    return apiInternalError('Failed to fetch entities');
  }
}
