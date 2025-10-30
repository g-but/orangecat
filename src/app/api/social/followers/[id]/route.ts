import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get followers with profile data
    // First get the follow relationships
    const {
      data: follows,
      error: followsError,
      count,
    } = await supabase
      .from('follows')
      .select('follower_id, created_at', { count: 'exact' })
      .eq('following_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (followsError) {
      logger.error('Error fetching follows:', followsError);
      return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 });
    }

    // Then fetch profiles for each follower_id
    const followerIds = (follows || []).map(f => f.follower_id);
    let followers = [];

    if (followerIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, name, avatar_url, bio, bitcoin_address, lightning_address')
        .in('id', followerIds);

      if (profilesError) {
        logger.error('Error fetching profiles:', profilesError);
        return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
      }

      // Combine follows with profiles
      followers = (follows || []).map(follow => {
        const profile = profiles?.find(p => p.id === follow.follower_id);
        return {
          follower_id: follow.follower_id,
          created_at: follow.created_at,
          profiles: profile || null,
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: followers || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    });
  } catch (error) {
    logger.error('Unexpected error in GET /api/social/followers/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
