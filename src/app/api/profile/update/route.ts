import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth'
import { createServerClient } from '@/services/supabase/server'
import { 
  isValidBitcoinAddress, 
  isValidLightningAddress, 
  isValidUsername, 
  isValidBio 
} from '@/utils/validation'
import { isValidUrl } from '@/utils/formValidation'
import { logger } from '@/utils/logger'

// Simple in-memory rate limiting (in production, use Redis or database)
const rateLimit = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5 // 5 updates per minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  
  // Clean up old entries
  const entries = Array.from(rateLimit.entries())
  for (const [key, data] of entries) {
    if (data.resetTime < now) {
      rateLimit.delete(key)
    }
  }
  
  const current = rateLimit.get(identifier)
  
  if (!current) {
    rateLimit.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  
  if (current.resetTime < now) {
    // Window expired, reset
    rateLimit.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false // Rate limit exceeded
  }
  
  current.count++
  return true
}

async function handleProfileUpdate(request: AuthenticatedRequest) {
  try {
    const supabase = await createServerClient()
    const user = request.user // User is already authenticated by withAuth middleware

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const rateLimitId = `profile_update:${user.id}:${clientIP}`
    
    if (!checkRateLimit(rateLimitId)) {
      return NextResponse.json(
        { error: 'Too many profile updates. Please wait a minute before trying again.' },
        { status: 429 }
      )
    }

    const { 
      username, 
      display_name, 
      bio, 
      website, 
      avatar_url, 
      banner_url, 
      bitcoin_address, 
      lightning_address 
    } = await request.json()

    // Enhanced username validation
    if (username) {
      const usernameValidation = isValidUsername(username)
      if (!usernameValidation.valid) {
        return NextResponse.json(
          { error: usernameValidation.error },
          { status: 400 }
        )
      }

      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .neq('id', user.id)
        .single()

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        )
      }
    }

    // Enhanced bio validation
    if (bio !== undefined) {
      const bioValidation = isValidBio(bio)
      if (!bioValidation.valid) {
        return NextResponse.json(
          { error: bioValidation.error },
          { status: 400 }
        )
      }
    }

    // Enhanced Bitcoin address validation
    if (bitcoin_address) {
      const btcValidation = isValidBitcoinAddress(bitcoin_address)
      if (!btcValidation.valid) {
        return NextResponse.json(
          { error: btcValidation.error },
          { status: 400 }
        )
      }
    }

    // Enhanced Lightning address validation
    if (lightning_address) {
      const lightningValidation = isValidLightningAddress(lightning_address)
      if (!lightningValidation.valid) {
        return NextResponse.json(
          { error: lightningValidation.error },
          { status: 400 }
        )
      }
    }

    // Website URL validation
    if (website) {
      const websiteValidation = isValidUrl(website)
      if (!websiteValidation.valid) {
        return NextResponse.json(
          { error: websiteValidation.error },
          { status: 400 }
        )
      }
    }

    // Avatar URL validation
    if (avatar_url) {
      const avatarValidation = isValidUrl(avatar_url)
      if (!avatarValidation.valid) {
        return NextResponse.json(
          { error: 'Invalid avatar URL format' },
          { status: 400 }
        )
      }
    }

    // Banner URL validation
    if (banner_url) {
      const bannerValidation = isValidUrl(banner_url)
      if (!bannerValidation.valid) {
        return NextResponse.json(
          { error: 'Invalid banner URL format' },
          { status: 400 }
        )
      }
    }

    // Update the profile with validated data
    const { data, error } = await supabase
      .from('profiles')
      .update({
        username,
        display_name,
        bio,
        website,
        avatar_url,
        banner_url,
        bitcoin_address,
        lightning_address,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Log successful update for security monitoring
    logger.info(`Profile updated successfully for user ${user.id}`, {
      username: !!username,
      bio: !!bio,
      bitcoin_address: !!bitcoin_address,
      lightning_address: !!lightning_address,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({ 
      success: true, 
      profile: data,
      message: 'Profile updated successfully' 
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the wrapped handler
export const POST = withAuth(handleProfileUpdate) 