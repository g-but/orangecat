import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // Get the current session from Supabase
    const { data: { session } } = await supabase.auth.getSession()
    
    // Extract the path from the URL
    const path = request.nextUrl.pathname
    
    // If user is not logged in and trying to access a protected route, redirect to /auth
    if (!session && protectedRoutes.some(route => path.startsWith(route))) {
      const redirectUrl = new URL('/auth', request.url)
      redirectUrl.searchParams.set('mode', 'login')
      redirectUrl.searchParams.set('from', path)
      return NextResponse.redirect(redirectUrl)
    }
    
    // If user is logged in and trying to access /auth, redirect to /dashboard
    if (session && path === '/auth') {
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