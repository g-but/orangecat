import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/services/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/auth?error=${encodeURIComponent('Verification failed')}`)
}





