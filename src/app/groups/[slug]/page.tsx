import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { DATABASE_TABLES } from '@/config/database-tables';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';

const GroupDetailClient = dynamic(
  () => import('@/components/groups/GroupDetail').then(mod => ({ default: mod.GroupDetail })),
  {
    loading: () => (
      <div className="max-w-5xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-2/3 bg-gray-100 rounded" />
          <div className="h-4 w-1/2 bg-gray-100 rounded" />
          <div className="h-72 w-full bg-gray-100 rounded" />
        </div>
      </div>
    ),
  }
);

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerClient();

  const { data: group } = await supabase
    .from(DATABASE_TABLES.GROUPS)
    .select('name, description, visibility, member_count')
    .eq('slug', slug)
    .single();

  if (!group) {
    return {
      title: 'Group Not Found | OrangeCat',
      description: 'The group you are looking for does not exist.',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = group as any;
  const title = `${g.name} | OrangeCat`;
  const description =
    g.description ||
    `Join ${g.name} on OrangeCat. ${g.member_count ? `${g.member_count} members.` : ''} Bitcoin community group.`;
  const url = `https://orangecat.ch/groups/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: g.name,
      description,
      url,
      type: 'website',
      siteName: 'OrangeCat',
    },
    twitter: {
      card: 'summary_large_image',
      title: g.name,
      description,
    },
  };
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Quick existence check server-side
  const supabase = await createServerClient();
  const { data: group } = await supabase
    .from(DATABASE_TABLES.GROUPS)
    .select('id, name, description')
    .eq('slug', slug)
    .single();

  if (!group) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = group as any;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: g.name,
    description: g.description || `Community group on OrangeCat`,
    url: `https://orangecat.ch/groups/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <GroupDetailClient groupSlug={slug} />
    </>
  );
}
