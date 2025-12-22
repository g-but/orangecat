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

export const metadata = {
  title: 'OrangeCat - Bitcoin Crowdfunding Platform',
  description:
    'Empowering communities through Bitcoin crowdfunding. Create, fund, and support projects with cryptocurrency.',
  keywords: 'bitcoin, crowdfunding, cryptocurrency, blockchain, funding, community',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
      </head>
      <body className="antialiased">
        <AuthProvider>
          <AppShell>
            <Suspense fallback={<Loading />}>{children}</Suspense>
          </AppShell>
        </AuthProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
