import { createServerSupabaseClient } from '@/services/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  if (code) {
    try {
      const supabase = createServerSupabaseClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth?error=${encodeURIComponent(error.message)}`
        )
      }

      // Successfully authenticated, redirect to the next page
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth?error=${encodeURIComponent('An unexpected error occurred during authentication')}`
      )
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    `${requestUrl.origin}/auth?error=${encodeURIComponent('No code provided')}`
  )
} 