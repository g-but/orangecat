import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://orangecat.com';
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'OrangeCat';

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
}; 