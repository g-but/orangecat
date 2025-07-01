import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  
  // Get all cookies first
  const allCookies = cookieStore.getAll()
  
  // Explicitly delete all auth-related cookies
  allCookies.forEach(cookie => {
    if (cookie.name.startsWith('sb-') || 
        cookie.name.includes('supabase') || 
        cookie.name.includes('auth')) {
      // REMOVED: console.log statement
      cookieStore.delete(cookie.name)
    }
  })
  
  // Create response and also clear cookies in the response
  const response = NextResponse.json({ 
    success: true, 
    message: 'Auth cookies cleared',
    timestamp: new Date().toISOString()
  })
  
  // Set all cookies to be deleted in the response as well
  allCookies.forEach(cookie => {
    if (cookie.name.startsWith('sb-') || 
        cookie.name.includes('supabase') || 
        cookie.name.includes('auth')) {
      response.cookies.delete(cookie.name)
    }
  })
  
  // Ensure no caching
  response.headers.set('Cache-Control', 'no-store, max-age=0')
  
  return response
} 