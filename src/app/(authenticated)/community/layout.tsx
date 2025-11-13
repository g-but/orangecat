import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community - OrangeCat',
  description:
    'Public timeline and community posts from the OrangeCat Bitcoin crowdfunding community.',
  keywords: 'bitcoin, crowdfunding, community, timeline, posts, social',
  openGraph: {
    title: 'Community - OrangeCat',
    description:
      'Public timeline and community posts from the OrangeCat Bitcoin crowdfunding community.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Community - OrangeCat',
    description:
      'Public timeline and community posts from the OrangeCat Bitcoin crowdfunding community.',
  },
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
