import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  // Default to dashboard with welcome flag - this is the first experience after email confirmation
  const next = requestUrl.searchParams.get('next') ?? '/dashboard?welcome=true&confirmed=true'

  if (token_hash && type) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Email confirmed successfully - redirect to dashboard with celebration
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }
  }

  // Provide more helpful error messages
  const errorMessage = 'Email verification failed. The link may have expired or already been used. Please try signing in or request a new verification email.'
  return NextResponse.redirect(`${requestUrl.origin}/auth?error=${encodeURIComponent(errorMessage)}&showResend=true`)
}





