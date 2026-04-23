import { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
import { getAllStories, getAllCategories } from '@/lib/stories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const StoriesPageClient = nextDynamic(() => import('@/components/stories/StoriesPageClient'), {
  loading: () => (
    <div className="max-w-5xl mx-auto p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-1/2 bg-gray-100 rounded" />
        <div className="h-4 w-1/3 bg-gray-100 rounded" />
        <div className="h-64 w-full bg-gray-100 rounded" />
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: 'Success Stories | OrangeCat',
  description:
    'Real stories from people using OrangeCat to fund projects, sell services, and build economic independence. From artists to entrepreneurs, researchers to educators—peer-to-peer economic participation without middlemen.',
  openGraph: {
    title: 'Success Stories | OrangeCat',
    description:
      'Real stories from real people using OrangeCat. No fees, no middlemen, just direct support.',
    type: 'website',
  },
};

export default function StoriesPage() {
  // Fetch stories from MDX files at build time
  const stories = getAllStories();
  const categories = getAllCategories();

  return <StoriesPageClient stories={stories} categories={categories} />;
}
