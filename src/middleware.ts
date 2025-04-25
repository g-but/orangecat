import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of public paths that don't require authentication
const publicPaths = ['/', '/auth', '/about', '/blog', '/fund-us']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name)
          if (!cookie) return undefined
          return decodeURIComponent(cookie.value)
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value: encodeURIComponent(value),
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const pathname = request.nextUrl.pathname

  // Allow access to public fund pages
  if (pathname.startsWith('/fund-us/')) {
    const fundId = pathname.split('/')[2]
    if (fundId) {
      const { data: fundPage } = await supabase
        .from('funding_pages')
        .select('is_public')
        .eq('id', fundId)
        .single()
      
      if (fundPage?.is_public) {
        return response
      }
    }
  }

  // Handle protected routes
  if (!session && !publicPaths.includes(pathname) && !pathname.startsWith('/fund-us/')) {
    const redirectUrl = new URL('/auth', request.url)
    redirectUrl.searchParams.set('mode', 'login')
    return NextResponse.redirect(redirectUrl)
  }

  // Handle authenticated users trying to access auth pages
  if (session && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Handle sign out
  if (pathname === '/auth/signout') {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
} 