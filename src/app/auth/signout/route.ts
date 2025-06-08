import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/services/supabase/server'
import { redirect } from 'next/navigation'

// This is a server-side API route that handles sign out
export async function GET(request: Request) {
  // Create server-side Supabase client
  const supabase = createServerClient()
  
  // Sign out from Supabase server-side
  await supabase.auth.signOut()
  
  // Get cookie store
  const cookieStore = cookies()
  
  // Manually clear all Supabase auth cookies
  cookieStore.getAll().forEach(cookie => {
    if (cookie.name.startsWith('sb-') || 
        cookie.name.includes('supabase') || 
        cookie.name.includes('auth')) {
      cookieStore.delete(cookie.name)
    }
  })
  
  // Create a response with cookie deletion
  const response = NextResponse.redirect(new URL('/', request.url))
  
  // Ensure cookies are also deleted on the response
  cookieStore.getAll().forEach(cookie => {
    if (cookie.name.startsWith('sb-') || 
        cookie.name.includes('supabase') || 
        cookie.name.includes('auth')) {
      response.cookies.delete(cookie.name)
    }
  })
  
  // Set additional headers to prevent caching
  response.headers.set('Cache-Control', 'no-store, max-age=0')
  
  // Server-side sign out completed
  
  return response
} 