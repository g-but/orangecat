import { NextResponse } from 'next/server'
import { createServerClient } from '@/services/supabase/server'
import { cookies } from 'next/headers'

// This is a server-side API route that handles sign out
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    
    // Get the current user before signing out
    const { data: { user } } = await supabase.auth.getUser()
    
    // Sign out using Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
    }

    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    // Manually clear all Supabase auth cookies
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-') ||
          cookie.name.includes('supabase') ||
          cookie.name.includes('auth')) {
        // REMOVED: console.log statement for security
        cookieStore.delete(cookie.name)
      }
    })

    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: 'Successfully signed out',
      user: user?.id || null
    })

    // Also clear cookies in the response headers
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-') ||
          cookie.name.includes('supabase') ||
          cookie.name.includes('auth')) {
        response.cookies.delete(cookie.name)
      }
    })

    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, max-age=0')

    return response

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    )
  }
} 