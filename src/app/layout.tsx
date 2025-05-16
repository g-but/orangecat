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
  const headersList = headers()
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  let profile = null

  // Debug logs for SSR state (before profile fetch)
  // console.log('SSR session before profile fetch:', session)
  // console.log('SSR user before profile fetch:', user)

  if (user) {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*') // Select only necessary fields if possible
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('SSR Profile Fetch Error:', profileError.message)
        // Decide how to handle: profile remains null, or throw error?
        // For now, let profile remain null and log the error.
        profile = null 
      } else {
        profile = profileData ?? null
      }
    } catch (error: any) {
      console.error('SSR Profile Fetch Exception:', error.message)
      profile = null // Ensure profile is null on exception
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
        {/* Auth cleanup script removed to fix MIME errors */}
      </head>
      <body className="min-h-screen bg-gradient-to-b from-tiffany-50 to-white" suppressHydrationWarning>
        <AuthProvider user={user} session={session} profile={profile}>
          <ClientErrorBoundary>
            <Suspense fallback={<Loading fullScreen />}>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow pt-20 pb-12">
                  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                  </div>
                </main>
                <Footer />
              </div>
            </Suspense>
          </ClientErrorBoundary>
          <Toaster position="top-right" />
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  )
} 