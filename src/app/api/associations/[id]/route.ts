import { NextRequest, NextResponse } from 'next/server';
import AssociationService from '@/services/supabase/associations';
import type { UpdateAssociationInput } from '@/services/supabase/associations';
import { logger } from '@/utils/logger';

/**
 * GET /api/associations/[id]
 * Get a specific association by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const association = await AssociationService.getAssociationById(params.id);

    if (!association) {
      return NextResponse.json(
        {
          success: false,
          error: 'Association not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: association
    });
  } catch (error) {
    logger.error('Error fetching association', { error, id: params.id });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch association'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/associations/[id]
 * Update an association
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const updates: UpdateAssociationInput = {
      role: body.role,
      status: body.status,
      bitcoin_reward_address: body.bitcoin_reward_address,
      reward_percentage: body.reward_percentage,
      permissions: body.permissions,
      metadata: body.metadata,
      visibility: body.visibility,
      ends_at: body.ends_at
    };

    const association = await AssociationService.updateAssociation(
      params.id,
      updates
    );

    return NextResponse.json({
      success: true,
      data: association
    });
  } catch (error) {
    logger.error('Error updating association', { error, id: params.id });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update association'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/associations/[id]
 * Delete an association
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await AssociationService.deleteAssociation(params.id);

    return NextResponse.json({
      success: true,
      message: 'Association deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting association', { error, id: params.id });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete association'
      },
      { status: 500 }
    );
  }
}




