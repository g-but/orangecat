import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community - OrangeCat',
  description:
    'Public timeline and community posts from the OrangeCat economic community.',
  keywords: 'bitcoin, community, timeline, posts, social, economic agent',
  openGraph: {
    title: 'Community - OrangeCat',
    description:
      'Public timeline and community posts from the OrangeCat economic community.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Community - OrangeCat',
    description:
      'Public timeline and community posts from the OrangeCat economic community.',
  },
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
