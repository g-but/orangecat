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
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = profileData ?? null
  }

  // Debug logs for SSR state
  console.log('SSR session:', session)
  console.log('SSR user:', user)
  console.log('SSR profile:', profile)
  console.log('SSR headers:', Object.fromEntries(headersList.entries()))

  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <body className="min-h-screen bg-gradient-to-b from-tiffany-50 to-white">
        <AuthProvider user={user} session={session} profile={profile}>
          <ClientErrorBoundary>
            <Suspense fallback={<Loading fullScreen />}>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow">
                  {children}
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