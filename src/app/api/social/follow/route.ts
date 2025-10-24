import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/utils/logger'

async function handleFollow(request: AuthenticatedRequest) {
  try {
    const supabase = await createServerClient()
    const user = request.user
    const { following_id } = await request.json()

    // Validate input
    if (!following_id) {
      return NextResponse.json(
        { error: 'following_id is required' },
        { status: 400 }
      )
    }

    // Prevent self-following
    if (user.id === following_id) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', following_id)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', following_id)
      .single()

    if (existingFollow) {
      return NextResponse.json(
        { success: true, message: 'Already following this user' }
      )
    }

    // Create follow relationship
    const { error: followError } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: following_id
      })

    if (followError) {
      logger.error('Error creating follow:', followError)
      return NextResponse.json(
        { error: 'Failed to follow user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully followed user'
    })

  } catch (error) {
    logger.error('Unexpected error in POST /api/social/follow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(handleFollow)




