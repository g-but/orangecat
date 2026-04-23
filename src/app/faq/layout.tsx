import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ | OrangeCat',
  description:
    'Frequently asked questions about OrangeCat — your AI economic agent for exchanging, funding, lending, investing, and governing with Bitcoin.',
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}
