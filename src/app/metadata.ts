import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://orangecat.ch';
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'OrangeCat';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'OrangeCat - Bitcoin Funding Made Simple',
  description: 'Your AI economic agent — exchange, fund, lend, invest, and govern with Bitcoin.',
  keywords: ['bitcoin', 'ai', 'economic agent', 'funding', 'lightning', 'blockchain'],
  authors: [{ name: 'OrangeCat' }],
  icons: {
    icon: [
      {
        url: '/images/orange-cat-logo.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon',
      },
    ],
    apple: {
      url: '/images/orange-cat-logo.svg',
      type: 'image/svg+xml',
    },
  },
  openGraph: {
    title: `${siteName} - Your AI Economic Agent`,
    description: 'Exchange, fund, lend, invest, and govern — with any identity, in any currency.',
    type: 'website',
    locale: 'en_US',
    siteName: siteName,
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Your AI Economic Agent`,
    description: 'Exchange, fund, lend, invest, and govern — with any identity, in any currency.',
  },
  robots: {
    index: true,
    follow: true,
  },
};
