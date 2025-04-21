'use client'

import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ClientErrorBoundary from '@/components/ClientErrorBoundary'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'
import { Suspense } from 'react'
import Loading from '@/components/Loading'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <body className="min-h-screen bg-gradient-to-b from-tiffany-50 to-white">
        <ClientErrorBoundary>
          <AuthProvider>
            <Suspense fallback={<Loading fullScreen />}>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
              </div>
            </Suspense>
          </AuthProvider>
        </ClientErrorBoundary>
        <Toaster position="top-right" />
      </body>
    </html>
  )
} 