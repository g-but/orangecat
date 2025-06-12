import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of public routes that don't require auth
const publicRoutes = ['/', '/auth', '/login', '/register', '/privacy', '/terms', '/about', '/blog']

// Routes that should redirect to /auth if user is not logged in
const protectedRoutes = ['/dashboard', '/profile', '/settings']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Add pathname to headers so layout can access it
  response.headers.set('x-pathname', request.nextUrl.pathname)

  try {
    // Check for authentication by looking for Supabase auth cookies
    // This is Edge Runtime compatible
    const accessToken = request.cookies.get('sb-access-token')?.value ||
                       request.cookies.get('supabase-auth-token')?.value ||
                       request.cookies.get('supabase.auth.token')?.value

    // More comprehensive check for any Supabase auth cookies
    const hasAuthCookie = Array.from(request.cookies.getAll()).some(cookie => 
      cookie.name.includes('supabase') && cookie.name.includes('auth')
    )
    
    // Extract the path from the URL
    const path = request.nextUrl.pathname
    
    // If user is not authenticated and trying to access a protected route, redirect to /auth
    if ((!accessToken && !hasAuthCookie) && protectedRoutes.some(route => path.startsWith(route))) {
      const redirectUrl = new URL('/auth', request.url)
      redirectUrl.searchParams.set('mode', 'login')
      redirectUrl.searchParams.set('from', path)
      return NextResponse.redirect(redirectUrl)
    }
    
    // If user is authenticated and trying to access /auth, redirect to /dashboard
    if ((accessToken || hasAuthCookie) && path === '/auth') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (error) {
    console.error('Middleware error:', error)
  }

  return response
}

// Only run middleware on routes that need authentication checks
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|api|.*\\..*).*)',
  ],
} 