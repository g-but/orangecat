import { Metadata } from 'next';
import StoriesPageClient from '@/components/stories/StoriesPageClient';
import { getAllStories, getAllCategories } from '@/lib/stories';

export const metadata: Metadata = {
  title: 'Success Stories | OrangeCat',
  description:
    'Real stories from real people using OrangeCat to fund their projects with Bitcoin. From artists to entrepreneurs, medical researchers to educators—see how direct Bitcoin funding makes real change.',
  openGraph: {
    title: 'Success Stories | OrangeCat',
    description:
      'Real stories from real people using Bitcoin crowdfunding. No fees, no middlemen, just direct support.',
    type: 'website',
  },
};

export default function StoriesPage() {
  // Fetch stories from MDX files at build time
  const stories = getAllStories();
  const categories = getAllCategories();

  return <StoriesPageClient stories={stories} categories={categories} />;
}
