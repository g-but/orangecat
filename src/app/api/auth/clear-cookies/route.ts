import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const cookieStore = cookies()
  
  // Explicitly delete all auth-related cookies
  cookieStore.getAll().forEach(cookie => {
    if (cookie.name.startsWith('sb-') || 
        cookie.name.includes('supabase') || 
        cookie.name.includes('auth')) {
      console.log(`[API] Clearing cookie: ${cookie.name}`)
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
  cookieStore.getAll().forEach(cookie => {
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