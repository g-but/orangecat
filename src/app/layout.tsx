import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ClientErrorBoundary from '@/components/ClientErrorBoundary'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://orangecat.com'
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'OrangeCat'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'OrangeCat - Bitcoin Donations Made Simple',
  description: 'Create your profile and start accepting Bitcoin donations today.',
  keywords: ['bitcoin', 'donation', 'crypto', 'blockchain'],
  authors: [{ name: `${siteName} Team` }],
  openGraph: {
    title: `${siteName} - Bitcoin Donation Platform`,
    description: 'A platform for accepting Bitcoin donations with ease.',
    type: 'website',
    locale: 'en_US',
    siteName: siteName,
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Bitcoin Donation Platform`,
    description: 'A platform for accepting Bitcoin donations with ease.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <body className="min-h-screen bg-gradient-to-b from-tiffany-50 to-white">
        <AuthProvider>
          <ProfileProvider>
            <ClientErrorBoundary>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
              </div>
            </ClientErrorBoundary>
          </ProfileProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 