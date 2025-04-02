import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ClientErrorBoundary from '@/components/ClientErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Palfare - Bitcoin Donation Platform',
  description: 'A platform for accepting Bitcoin donations with ease.',
  keywords: ['bitcoin', 'donation', 'crypto', 'blockchain'],
  authors: [{ name: 'Palfare Team' }],
  openGraph: {
    title: 'Palfare - Bitcoin Donation Platform',
    description: 'A platform for accepting Bitcoin donations with ease.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Palfare',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Palfare - Bitcoin Donation Platform',
    description: 'A platform for accepting Bitcoin donations with ease.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientErrorBoundary>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow pt-16">{children}</main>
            <Footer />
          </div>
        </ClientErrorBoundary>
      </body>
    </html>
  )
} 