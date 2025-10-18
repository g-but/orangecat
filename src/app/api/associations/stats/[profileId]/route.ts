import { NextRequest, NextResponse } from 'next/server';
import AssociationService from '@/services/supabase/associations';
import { logger } from '@/utils/logger';

/**
 * GET /api/associations/stats/[profileId]
 * Get association statistics for a profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { profileId: string } }
) {
  try {
    const stats = await AssociationService.getAssociationStats(params.profileId);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching association stats', { error, profileId: params.profileId });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch association stats'
      },
      { status: 500 }
    );
  }
}




