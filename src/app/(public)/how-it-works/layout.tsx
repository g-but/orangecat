import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'Learn how OrangeCat helps people and agents publish and fund work with Bitcoin.',
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
