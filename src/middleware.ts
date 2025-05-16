import { createServerClient } from '@/services/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of public paths that don't require authentication
const publicPaths = ['/', '/auth', '/about', '/blog', '/fund-us', '/fund-others']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient()
  
  // Revert to getSession() which works with the current cookie setup
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  // Check if the path is public
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(`${path}/`)
  )

  // Special handling for auth paths
  if (request.nextUrl.pathname.startsWith('/auth')) {
    if (session?.user) {
      // If user is authenticated, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // If no session or error getting session
  if (!session?.user || sessionError) {
    // Clear any existing auth cookies
    request.cookies.getAll().forEach(cookie => {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.delete(cookie.name)
      }
    })

    // If trying to access a protected route, redirect to auth
    if (!isPublicPath) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
    
    return response
  }

  // User exists, check for profile if accessing protected routes
  if (!isPublicPath) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle()

    // If no profile exists and not already on profile page
    if (!profile && !request.nextUrl.pathname.startsWith('/profile')) {
      return NextResponse.redirect(new URL('/profile', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
} 