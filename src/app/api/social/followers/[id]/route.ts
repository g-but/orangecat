import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/services/supabase/server'
import { logger } from '@/utils/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { id } = params
    const { searchParams } = new URL(request.url)

    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get followers with profile data
    const { data: followers, error, count } = await supabase
      .from('follows')
      .select(`
        follower_id,
        created_at,
        profiles!follows_follower_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          bio
        )
      `, { count: 'exact' })
      .eq('following_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('Error fetching followers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch followers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: followers || [],
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    })

  } catch (error) {
    logger.error('Unexpected error in GET /api/social/followers/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}







