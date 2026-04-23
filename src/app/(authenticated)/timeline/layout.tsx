import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Timeline - OrangeCat',
  description:
    'Share your personal timeline, achievements, and updates with the OrangeCat community.',
  keywords: ['bitcoin', 'timeline', 'achievements', 'community', 'economic agent'],
  openGraph: {
    title: 'My Timeline - OrangeCat',
    description: 'Share your personal timeline and achievements with the OrangeCat community.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Journey - OrangeCat',
    description: 'Share your personal timeline and achievements with the OrangeCat community.',
  },
};

export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
