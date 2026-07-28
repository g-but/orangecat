import { Metadata } from 'next';
import { APP_NAME, SITE_URL } from '@/config/brand';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || APP_NAME;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${APP_NAME} - Bitcoin Funding Made Simple`,
  description: 'Your AI economic agent — exchange, fund, lend, invest, and govern with Bitcoin.',
  keywords: ['bitcoin', 'ai', 'economic agent', 'funding', 'lightning', 'blockchain'],
  authors: [{ name: APP_NAME }],
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
    description: 'Exchange, fund, lend, invest, and govern — with any identity, settled in Bitcoin.',
    type: 'website',
    locale: 'en_US',
    siteName: siteName,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Your AI Economic Agent`,
    description: 'Exchange, fund, lend, invest, and govern — with any identity, settled in Bitcoin.',
  },
  robots: {
    index: true,
    follow: true,
  },
};
