import '../polyfills'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ClientErrorBoundary from '@/components/ClientErrorBoundary'
import { Toaster } from 'sonner'
import { Suspense } from 'react'
import Loading from '@/components/Loading'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { createServerClient } from '@/services/supabase/server'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { headers } from 'next/headers'
import Script from 'next/script'
import { GlobalAuthErrorBanner } from '@/components/Loading'
import { GlobalAuthLoader } from '@/components/Loading'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
})

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  
  // Get current pathname to determine if we're on an authenticated route
  const pathname = headersList.get('x-pathname') || ''
  const isAuthenticatedRoute = pathname.startsWith('/dashboard') || 
                              pathname.startsWith('/profile') || 
                              pathname.startsWith('/settings') ||
                              pathname.startsWith('/assets') ||
                              pathname.startsWith('/people') ||
                              pathname.startsWith('/events') ||
                              pathname.startsWith('/organizations') ||
                              pathname.startsWith('/projects')

  const supabase = await createServerClient()
  
  // Use getUser() for security - validates authentication with server
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // Get session only if we have a valid authenticated user
  let session = null
  if (user && !userError) {
    const { data: { session: userSession } } = await supabase.auth.getSession()
    session = userSession
  }

  // Try to get profile data if user exists and is authenticated
  let profile = null
  if (user && !userError) {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (!error && profileData) {
        profile = profileData
      }
    } catch (error) {
      // Profile fetch error in RootLayout - silently handle
    }
  }

  // Debug logs for SSR state (after profile fetch attempt)
  // console.log('SSR session after profile fetch:', session)
  // console.log('SSR user after profile fetch:', user)
  // console.log('SSR profile after profile fetch:', profile)
  // console.log('SSR headers:', Object.fromEntries(headersList.entries()))

  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        {/* Enhanced global polyfill for Vercel deployment compatibility */}
        <Script
          id="global-polyfill"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Ensure globalThis exists first
                if (typeof globalThis === 'undefined') {
                  if (typeof global !== 'undefined') {
                    global.globalThis = global;
                  } else if (typeof window !== 'undefined') {
                    window.globalThis = window;
                  } else if (typeof self !== 'undefined') {
                    self.globalThis = self;
                  } else {
                    // Create a minimal globalThis
                    var globalThis = {};
                  }
                }
                
                // Define self if it doesn't exist
                if (typeof self === 'undefined') {
                  globalThis.self = globalThis;
                  if (typeof global !== 'undefined') {
                    global.self = globalThis;
                  }
                }
                
                // Define global if it doesn't exist
                if (typeof global === 'undefined') {
                  globalThis.global = globalThis;
                }
                
                // Ensure window exists in appropriate contexts
                if (typeof window === 'undefined' && typeof globalThis !== 'undefined') {
                  globalThis.window = globalThis;
                }
              })();
            `,
          }}
        />
        {/* Auth cleanup script removed to fix MIME errors */}
      </head>
      <body className="min-h-screen bg-gradient-to-b from-tiffany-50 to-white safe-area-padding" suppressHydrationWarning>
        <AuthProvider user={user} session={session} profile={profile}>
          <GlobalAuthErrorBanner />
          <ClientErrorBoundary>
            <Suspense fallback={<Loading fullScreen />}>
              {/* Global loading overlay based on auth store */}
              <GlobalAuthLoader />
              <div className="min-h-screen flex flex-col">
                {/* Only show main header on public routes */}
                {!isAuthenticatedRoute && <Header />}
                <main className={`flex-grow ${!isAuthenticatedRoute ? 'pt-16 sm:pt-20' : ''}`}>
                  {children}
                </main>
                <Footer />
              </div>
            </Suspense>
          </ClientErrorBoundary>
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                marginTop: '4rem',
              },
            }}
          />
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  )
} 