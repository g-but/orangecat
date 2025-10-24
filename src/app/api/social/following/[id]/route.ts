import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient();
    const { id } = params;
    const { searchParams } = new URL(request.url);

    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get following with profile data
    const {
      data: following,
      error,
      count,
    } = await supabase
      .from('follows')
      .select(
        `
        following_id,
        created_at,
        profiles!follows_following_id_fkey (
          id,
          username,
          name,
          avatar_url,
          bio
        )
      `,
        { count: 'exact' }
      )
      .eq('follower_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching following:', error);
      return NextResponse.json({ error: 'Failed to fetch following' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: following || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    });
  } catch (error) {
    logger.error('Unexpected error in GET /api/social/following/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
