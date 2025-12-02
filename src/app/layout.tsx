import { Inter, Playfair_Display } from 'next/font/google';

// Font loading with optimized preloading strategy
// Primary font (Inter) is preloaded for faster FCP
// Secondary font (Playfair Display) is lazy loaded to reduce initial bundle
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
  preload: true, // Enable preload for primary font (critical for FCP)
  adjustFontFallback: true, // Optimize font fallback rendering
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
  display: 'swap',
  fallback: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
  preload: false, // Keep secondary font lazy loaded (not critical for initial render)
  adjustFontFallback: true,
});
import './globals.css';
import ClientErrorBoundary from '@/components/ClientErrorBoundary';
import { Suspense, lazy } from 'react';
import Loading, { GlobalAuthLoader } from '@/components/Loading';
import { createServerClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import Script from 'next/script';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { SyncManagerInitializer } from '@/components/SyncManagerInitializer';
import { OfflineQueueIndicator } from '@/components/ui/OfflineQueueIndicator';
import { ComposerProvider } from '@/contexts/ComposerContext';

// Dynamic imports for non-critical components
const DynamicToaster = lazy(() => import('sonner').then(module => ({ default: module.Toaster })));
const DynamicToastContainer = lazy(() => import('@/components/ui/Toast'));
const DynamicAnalytics = lazy(() =>
  import('@vercel/analytics/react').then(module => ({ default: module.Analytics }))
);
const DynamicSpeedInsights = lazy(() =>
  import('@vercel/speed-insights/next').then(module => ({ default: module.SpeedInsights }))
);
const DynamicUnifiedHeader = lazy(() => import('@/components/layout/UnifiedHeader'));
const DynamicFooter = lazy(() => import('@/components/layout/Footer'));
const DynamicMobileBottomNav = lazy(() => import('@/components/layout/MobileBottomNav'));
const DynamicChatbot = lazy(() =>
  import('@/components/ui/SimpleChatbot').then(module => ({ default: module.SimpleChatbot }))
);

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();

  // Get current pathname to determine if we're on an authenticated route
  const pathname = headersList.get('x-pathname') || '';
  const isAuthenticatedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/people') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/organizations') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/funding');

  // PERFORMANCE OPTIMIZATION: Only fetch auth data for authenticated routes
  // Public pages (homepage, discover, blog, etc.) don't need auth data
  // This saves 500ms-2s on every public page load
  let user = null;
  let profile = null;

  if (isAuthenticatedRoute) {
    const supabase = await createServerClient();

    // Get user for secure auth state (getUser() validates token with server)
    const {
      data: { user: userData },
      error: userError,
    } = await supabase.auth.getUser();

    user = userData;

    // Try to get profile data if user exists and is authenticated
    if (user && !userError) {
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && profileData) {
          profile = profileData;
        }
      } catch (error) {
        // Profile fetch error in RootLayout - silently handle
      }
    }
  }

  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Mobile-first viewport with PWA support */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover"
        />

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

        {/* SEO Meta Tags */}
        <meta
          name="description"
          content="Simple Bitcoin-native crowdfunding platform. Send Bitcoin to fund projects you believe in. Every satoshi is tracked transparently."
        />
        <meta
          name="keywords"
          content="bitcoin, crowdfunding, crypto, funding, blockchain, donations, transparency"
        />
        <meta name="author" content="OrangeCat" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://orangecat.ch/" />
        <meta property="og:title" content="OrangeCat - Bitcoin Crowdfunding" />
        <meta
          property="og:description"
          content="Simple Bitcoin-native crowdfunding platform. Send Bitcoin to fund projects you believe in. Every satoshi is tracked transparently."
        />
        <meta property="og:image" content="https://orangecat.ch/og-image.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://orangecat.ch/" />
        <meta property="twitter:title" content="OrangeCat - Bitcoin Crowdfunding" />
        <meta
          property="twitter:description"
          content="Simple Bitcoin-native crowdfunding platform. Send Bitcoin to fund projects you believe in. Every satoshi is tracked transparently."
        />
        <meta property="twitter:image" content="https://orangecat.ch/og-image.png" />

        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <link rel="canonical" href="https://orangecat.ch/" />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Service Worker Registration - Only in Production */}
        <Script
          id="service-worker-registration"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if ('serviceWorker' in navigator) {
                  const isDevelopment = window.location.hostname === 'localhost' || 
                                       window.location.hostname === '127.0.0.1' ||
                                       window.location.hostname.includes('localhost') ||
                                       window.location.hostname === '0.0.0.0';
                  
                  if (isDevelopment) {
                    // In development: Aggressively unregister ALL service workers
                    console.log('[SW] Development mode detected - disabling service workers');
                    
                    // Unregister immediately
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      console.log('[SW] Found', registrations.length, 'service worker(s) to unregister');
                      const unregisterPromises = registrations.map(function(registration) {
                        return registration.unregister().then(function(success) {
                          console.log('[SW] Unregistered:', success);
                          return success;
                        });
                      });
                      
                      // Clear ALL caches
                      return Promise.all(unregisterPromises).then(function() {
                        return caches.keys();
                      });
                    }).then(function(cacheNames) {
                      console.log('[SW] Found', cacheNames.length, 'cache(s) to delete');
                      return Promise.all(
                        cacheNames.map(function(cacheName) {
                          console.log('[SW] Deleting cache:', cacheName);
                          return caches.delete(cacheName);
                        })
                      );
                    }).then(function() {
                      console.log('[SW] All service workers and caches cleared for development');
                      // Force reload if there was a service worker
                      if (navigator.serviceWorker.controller) {
                        console.log('[SW] Service worker was controlling page, reloading...');
                        window.location.reload();
                      }
                    }).catch(function(error) {
                      console.error('[SW] Error clearing service workers:', error);
                    });
                  } else {
                  // In production: Register service worker normally
                  window.addEventListener('load', function() {
                    // Unregister all existing service workers first to clear stale cache
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for(let registration of registrations) {
                        registration.unregister();
                      }
                      // Then register the new one
                      return navigator.serviceWorker.register('/sw.js');
                    }).then(function(registration) {
                      // Service Worker registration successful
                      
                      // Check for updates
                      registration.addEventListener('updatefound', function() {
                        const newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed') {
                              if (navigator.serviceWorker.controller) {
                                // New content available - force reload to get fresh code
                                window.location.reload();
                              } else {
                                // Content cached for first time - app now works offline
                              }
                            }
                          });
                        }
                      });
                    })
                    .catch(function(error) {
                      // Service Worker registration failed - app will work without offline features
                      console.warn('Service Worker registration failed:', error);
                    });
                  });
                  }
                }
              })();
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
                // PWA install prompt available
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
                        // PWA install choice recorded
                        deferredPrompt = null;
                        installButton.style.display = 'none';
                      });
                    }
                  });
                }
              });
              
              window.addEventListener('appinstalled', (evt) => {
                // PWA app installed successfully
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
              if (typeof window !== 'undefined' && !window.global) {
                window.global = window;
              }
            `,
          }}
        />
      </head>

      <body
        className="font-inter antialiased bg-white text-slate-900 overflow-x-hidden"
        suppressHydrationWarning={true}
      >
        <div id="__next">
          <ClientErrorBoundary>
            <SyncManagerInitializer />
            <AuthProvider>
              <ComposerProvider>
                <div className="relative min-h-screen flex flex-col">
                  {/* Global Auth Loader - temporarily disabled for debugging */}
                  {/* <GlobalAuthLoader /> */}

                  {/* Header */}
                  <Suspense fallback={<Loading />}>
                    <DynamicUnifiedHeader />
                  </Suspense>

                  {/* Main Content */}
                  <main className="flex-1 flex flex-col">{children}</main>

                  {/* Footer */}
                  <Suspense fallback={<div className="h-16" />}>
                    <DynamicFooter />
                  </Suspense>

                  {/* Mobile Bottom Navigation - Available on all routes */}
                  <Suspense fallback={null}>
                    <DynamicMobileBottomNav />
                  </Suspense>
                </div>
              </ComposerProvider>
            </AuthProvider>

            {/* Toast Notifications */}
            <Suspense fallback={null}>
              <DynamicToaster position="top-right" />
            </Suspense>

            {/* Custom Toast Container */}
            <Suspense fallback={null}>
              <DynamicToastContainer />
            </Suspense>

            {/* Analytics */}
            <Suspense fallback={null}>
              <DynamicAnalytics />
            </Suspense>

            {/* Speed Insights */}
            <Suspense fallback={null}>
              <DynamicSpeedInsights />
            </Suspense>

            {/* Simple Chatbot Assistant - Lazy loaded */}
            <Suspense fallback={null}>
              <DynamicChatbot />
            </Suspense>

            {/* Offline Queue Indicator */}
            <OfflineQueueIndicator />
          </ClientErrorBoundary>
        </div>
      </body>
    </html>
  );
}
