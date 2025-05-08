import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/services/supabase/server'

// Bitcoin address validation regex
const BITCOIN_ADDRESS_REGEX = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/

// Lightning address validation regex
const LIGHTNING_ADDRESS_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export async function POST(request: Request) {
  try {
    const { username, bio, bitcoin_address, lightning_address } = await request.json()
    const supabase = createServerSupabaseClient()

    // Get the current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate username if provided
    if (username) {
      if (username.length < 3) {
        return NextResponse.json(
          { error: 'Username must be at least 3 characters long' },
          { status: 400 }
        )
      }

      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .neq('id', session.user.id)
        .single()

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        )
      }
    }

    // Validate Bitcoin address if provided
    if (bitcoin_address && !BITCOIN_ADDRESS_REGEX.test(bitcoin_address)) {
      return NextResponse.json(
        { error: 'Invalid Bitcoin address format' },
        { status: 400 }
      )
    }

    // Validate Lightning address if provided
    if (lightning_address && !LIGHTNING_ADDRESS_REGEX.test(lightning_address)) {
      return NextResponse.json(
        { error: 'Invalid Lightning address format' },
        { status: 400 }
      )
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username,
        bio,
        bitcoin_address,
        lightning_address,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating profile' },
      { status: 500 }
    )
  }
} 