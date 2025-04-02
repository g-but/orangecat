import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
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
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
} 