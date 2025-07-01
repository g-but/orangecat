import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import ClientErrorBoundary from '@/components/ClientErrorBoundary'
import { Suspense, lazy } from 'react'
import Loading from '@/components/Loading'
import { createServerClient } from '@/services/supabase/server'
import { AuthProvider } from '@/components/AuthProvider'
import { headers } from 'next/headers'
import Script from 'next/script'
import { GlobalAuthErrorBanner } from '@/components/Loading'
import { GlobalAuthLoader } from '@/components/Loading'

// Dynamic imports for non-critical components
const DynamicToaster = lazy(() => import('sonner').then(module => ({ default: module.Toaster })))
const DynamicAnalytics = lazy(() => import('@vercel/analytics/react').then(module => ({ default: module.Analytics })))
const DynamicSpeedInsights = lazy(() => import('@vercel/speed-insights/next').then(module => ({ default: module.SpeedInsights })))
const DynamicUnifiedHeader = lazy(() => import('@/components/layout/UnifiedHeader'))
const DynamicFooter = lazy(() => import('@/components/layout/Footer'))

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
  
  // Get user for secure auth state (getUser() validates token with server)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // Use null for session - AuthProvider handles user-only auth state
  const session = null

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
  // REMOVED: console.log statement for security
  // REMOVED: console.log statement for security
  // REMOVED: console.log statement
  // REMOVED: console.log statement

  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`} suppressHydrationWarning>
      <head>
        {/* Mobile-first viewport with PWA support */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* PWA Theme Colors */}
        <meta name="theme-color" content="#F7931A" />
        <meta name="background-color" content="#ffffff" />
        
        {/* Mobile Safari PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OrangeCat" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        
        {/* Mobile Chrome PWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="OrangeCat" />
        
        {/* Windows PWA */}
        <meta name="msapplication-TileColor" content="#F7931A" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Service Worker Registration */}
        <Script
          id="service-worker-registration"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('[SW] Registration successful:', registration.scope);
                      
                      // Check for updates
                      registration.addEventListener('updatefound', function() {
                        const newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed') {
                              if (navigator.serviceWorker.controller) {
                                // New content available, notify user
                                console.log('[SW] New content available');
                              } else {
                                // Content cached for first time
                                console.log('[SW] Content cached for offline use');
                              }
                            }
                          });
                        }
                      });
                    })
                    .catch(function(error) {
                      console.log('[SW] Registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
        
        {/* PWA Install Prompt */}
        <Script
          id="pwa-install-prompt"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              let deferredPrompt;
              let installButton;
              
              window.addEventListener('beforeinstallprompt', (e) => {
                console.log('[PWA] Install prompt available');
                e.preventDefault();
                deferredPrompt = e;
                
                // Show install button if available
                installButton = document.getElementById('pwa-install-btn');
                if (installButton) {
                  installButton.style.display = 'block';
                  installButton.addEventListener('click', () => {
                    if (deferredPrompt) {
                      deferredPrompt.prompt();
                      deferredPrompt.userChoice.then((choiceResult) => {
                        console.log('[PWA] User choice:', choiceResult.outcome);
                        deferredPrompt = null;
                        installButton.style.display = 'none';
                      });
                    }
                  });
                }
              });
              
              window.addEventListener('appinstalled', (evt) => {
                console.log('[PWA] App installed');
                if (installButton) {
                  installButton.style.display = 'none';
                }
              });
            `,
          }}
        />
        
        {/* Simplified global polyfill */}
        <Script
          id="global-polyfill"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof globalThis === 'undefined') {
                if (typeof global !== 'undefined') {
                  global.globalThis = global;
                } else if (typeof window !== 'undefined') {
                  window.globalThis = window;
                } else if (typeof self !== 'undefined') {
                  self.globalThis = self;
                }
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-tiffany-50 to-white safe-area-padding" suppressHydrationWarning>
        <AuthProvider user={user} session={session} profile={profile}>
          <GlobalAuthErrorBanner />
          <ClientErrorBoundary>
            <Suspense fallback={<Loading fullScreen />}>
              {/* Global loading overlay based on auth store */}
              <GlobalAuthLoader />
              <div className="min-h-screen flex flex-col">
                {/* Global consistent header - only for non-authenticated routes */}
                {!isAuthenticatedRoute && (
                  <Suspense fallback={<div className="h-16 sm:h-20 bg-white shadow-sm" />}>
                    <DynamicUnifiedHeader showSearch={true} />
                  </Suspense>
                )}
                <main className={`flex-grow ${!isAuthenticatedRoute ? 'pt-16 sm:pt-20' : ''}`}>
                  {children}
                </main>
                <Suspense fallback={<div className="h-32 bg-gray-50" />}>
                  <DynamicFooter />
                </Suspense>
              </div>
            </Suspense>
          </ClientErrorBoundary>
          <Suspense fallback={null}>
            <DynamicToaster 
              position="top-right" 
              toastOptions={{
                style: {
                  marginTop: '4rem',
                },
              }}
            />
          </Suspense>
          <Suspense fallback={null}>
            <DynamicAnalytics />
          </Suspense>
          <Suspense fallback={null}>
            <DynamicSpeedInsights />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  )
} 