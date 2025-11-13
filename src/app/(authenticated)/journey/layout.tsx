import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Journey - OrangeCat',
  description:
    'Share your personal timeline, achievements, and journey with the Bitcoin crowdfunding community.',
  keywords: ['bitcoin', 'crowdfunding', 'timeline', 'journey', 'achievements', 'community'],
  openGraph: {
    title: 'My Journey - OrangeCat',
    description: 'Share your personal timeline and achievements with the Bitcoin community.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Journey - OrangeCat',
    description: 'Share your personal timeline and achievements with the Bitcoin community.',
  },
};

export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
