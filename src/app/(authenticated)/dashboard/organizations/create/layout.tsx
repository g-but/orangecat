import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'New Group', template: '%s | OrangeCat' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
