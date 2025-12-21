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
import Script from 'next/script';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from '@/components/ui/sonner';
import Loading from '@/components/Loading';
import { Suspense } from 'react';
import { MessagesUnreadProvider } from '@/contexts/MessagesUnreadContext';

// Force dynamic rendering to avoid problematic static pre-render of 404
export const dynamic = 'force-dynamic';

// Temporarily disable non-critical dynamic components while isolating build issue

export default async function RootLayout({ children }: { children: React.ReactNode }) {

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
                if (!('serviceWorker' in navigator)) { return; }
                const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].some(host =>
                  window.location.hostname === host || window.location.hostname.includes(host)
                );
                if (isLocalhost) {
                  // Skip SW in development to avoid cache noise
                  return;
                }
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {
                    // Silently fail; app runs without offline cache
                  });
                });
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
          <AuthProvider>
            <MessagesUnreadProvider>
              <Suspense fallback={<Loading fullScreen contextual message="Loading layout..." /> }>
                <AppShell>
                  {children}
                </AppShell>
              </Suspense>
            </MessagesUnreadProvider>
          </AuthProvider>
        </div>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
