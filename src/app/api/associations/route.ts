import { NextRequest, NextResponse } from 'next/server';
import AssociationService from '@/services/supabase/associations';
import type { CreateAssociationInput, AssociationFilters, QueryOptions } from '@/services/supabase/associations';
import { logger } from '@/utils/logger';

/**
 * GET /api/associations
 * Get associations for a profile
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const entityId = searchParams.get('entityId');
    const entityType = searchParams.get('entityType');

    // Build filters from query params
    const filters: AssociationFilters = {};
    
    const relationshipTypes = searchParams.get('relationshipType');
    if (relationshipTypes) {
      filters.relationship_type = relationshipTypes.split(',') as any[];
    }

    const targetEntityTypes = searchParams.get('targetEntityType');
    if (targetEntityTypes) {
      filters.target_entity_type = targetEntityTypes.split(',') as any[];
    }

    const statuses = searchParams.get('status');
    if (statuses) {
      filters.status = statuses.split(',') as any[];
    }

    const visibility = searchParams.get('visibility');
    if (visibility) {
      filters.visibility = visibility.split(',') as any[];
    }

    const createdAfter = searchParams.get('createdAfter');
    if (createdAfter) {
      filters.created_after = createdAfter;
    }

    const createdBefore = searchParams.get('createdBefore');
    if (createdBefore) {
      filters.created_before = createdBefore;
    }

    const hasBitcoinReward = searchParams.get('hasBitcoinReward');
    if (hasBitcoinReward !== null) {
      filters.has_bitcoin_reward = hasBitcoinReward === 'true';
    }

    // Build query options
    const options: QueryOptions = {};
    
    const limit = searchParams.get('limit');
    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    const offset = searchParams.get('offset');
    if (offset) {
      options.offset = parseInt(offset, 10);
    }

    const orderBy = searchParams.get('orderBy');
    if (orderBy) {
      options.order_by = orderBy;
    }

    const orderDirection = searchParams.get('orderDirection');
    if (orderDirection) {
      options.order_direction = orderDirection as 'asc' | 'desc';
    }

    // Get associations based on query type
    let associations;
    
    if (entityId && entityType) {
      // Get associations for a specific entity
      associations = await AssociationService.getEntityAssociations(
        entityId,
        entityType as any,
        filters,
        options
      );
    } else if (profileId) {
      // Get associations for a profile
      associations = await AssociationService.getProfileAssociations(
        profileId,
        filters,
        options
      );
    } else {
      return NextResponse.json(
        { error: 'Either profileId or (entityId + entityType) must be provided' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: associations,
      count: associations.length
    });
  } catch (error) {
    logger.error('Error fetching associations', { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch associations'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/associations
 * Create a new association
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.target_entity_id || !body.target_entity_type || !body.relationship_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: target_entity_id, target_entity_type, relationship_type'
        },
        { status: 400 }
      );
    }

    const input: CreateAssociationInput = {
      target_entity_id: body.target_entity_id,
      target_entity_type: body.target_entity_type,
      relationship_type: body.relationship_type,
      role: body.role,
      bitcoin_reward_address: body.bitcoin_reward_address,
      reward_percentage: body.reward_percentage,
      permissions: body.permissions,
      metadata: body.metadata,
      visibility: body.visibility
    };

    const association = await AssociationService.createAssociation(input);

    return NextResponse.json({
      success: true,
      data: association
    }, { status: 201 });
  } catch (error) {
    logger.error('Error creating association', { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create association'
      },
      { status: 500 }
    );
  }
}




