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
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from '@/components/ui/sonner';
import { Suspense } from 'react';

export const metadata = {
  title: 'OrangeCat - The Bitcoin Super-App',
  description:
    'Commerce, finance, community, and AI—all powered by Bitcoin. Sell products, offer services, fund projects, build communities, and deploy AI in one unified platform.',
  keywords:
    'bitcoin, super-app, commerce, finance, community, AI, products, services, crowdfunding, cryptocurrency, blockchain, lightning network, peer-to-peer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <body className="antialiased">
        <QueryProvider>
          <AuthProvider>
            <AppShell>
              <Suspense>{children}</Suspense>
            </AppShell>
          </AuthProvider>
        </QueryProvider>
        <Toaster position="top-right" richColors closeButton />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
