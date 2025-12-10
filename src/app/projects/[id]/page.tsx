import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

const ProjectPageClient = dynamic(() => import('@/components/project/ProjectPageClient'), {
  loading: () => (
    <div className="max-w-5xl mx-auto p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-2/3 bg-gray-100 rounded" />
        <div className="h-4 w-1/2 bg-gray-100 rounded" />
        <div className="h-72 w-full bg-gray-100 rounded" />
      </div>
    </div>
  ),
});

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Generate metadata for project pages
 * This enables SEO and social media preview cards (Twitter, Facebook, LinkedIn, etc.)
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: project } = await supabase
    .from('projects')
    .select('title, description, goal_amount, raised_amount, currency, category, status, user_id')
    .eq('id', id)
    .single();

  if (!project) {
    return {
      title: 'Project Not Found | OrangeCat',
      description: 'The project you are looking for does not exist.',
    };
  }

  // Fetch creator profile separately for metadata
  let creatorProfile = null;
  if (project.user_id) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, name, avatar_url')
      .eq('id', project.user_id)
      .maybeSingle();

    if (profileData) {
      creatorProfile = profileData;
    }
  }

  // Calculate progress for description
  const progress = project.goal_amount
    ? Math.round((Number(project.raised_amount || 0) / Number(project.goal_amount)) * 100)
    : 0;

  const creatorName =
    (creatorProfile as any)?.name ||
    creatorProfile?.username ||
    'Creator';
  const title = `${project.title} | OrangeCat`;
  const description =
    project.description ||
    `Support ${project.title} on OrangeCat. ${progress > 0 ? `${progress}% funded. ` : ''}Bitcoin fundraising project by ${creatorName}.`;
  const image = creatorProfile?.avatar_url || '/images/og-default.png';
  const url = `https://orangecat.ch${ROUTES.PROJECTS.VIEW(id)}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: project.title,
      description,
      images: [image],
      url,
      type: 'website',
      siteName: 'OrangeCat',
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description,
      images: [image],
    },
  };
}

/**
 * Public Project Page - Server Component
 *
 * This page is publicly accessible and server-side rendered for:
 * - SEO optimization
 * - Social media preview cards (no more "Loading..." on Twitter/Facebook)
 * - Fast initial page load
 * - Proper metadata for search engines
 */
export default async function PublicProjectPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Fetch project data server-side
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Fetch profile separately (more reliable than JOIN)
  let profile = null;
  if (project.user_id) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, username, name, avatar_url')
      .eq('id', project.user_id)
      .maybeSingle();

    if (profileData) {
      profile = profileData;
    }
  }

  // Ensure raised_amount exists
  const projectWithProfile = {
    ...project,
    raised_amount: project.raised_amount ?? 0,
    profiles: profile,
  };

  // Generate JSON-LD structured data for SEO
  const creatorName =
    (profile as any)?.name || profile?.username || 'Creator';
  const progress = project.goal_amount
    ? Math.round((Number(project.raised_amount || 0) / Number(project.goal_amount)) * 100)
    : 0;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.description || `Support ${project.title} on OrangeCat`,
    url: `https://orangecat.ch/projects/${id}`,
    creator: {
      '@type': 'Person',
      name: creatorName,
      ...(profile?.username && { url: `https://orangecat.ch/profiles/${profile.username}` }),
    },
    ...(project.goal_amount && {
      funding: {
        '@type': 'MonetaryGrant',
        amount: {
          '@type': 'MonetaryAmount',
          value: project.goal_amount,
          currency: project.currency || 'SATS',
        },
        ...(project.raised_amount && {
          amountRaised: {
            '@type': 'MonetaryAmount',
            value: project.raised_amount,
            currency: project.currency || 'SATS',
          },
        }),
      },
    }),
    ...(project.bitcoin_address && {
      paymentAccepted: 'Bitcoin',
      bitcoinAddress: project.bitcoin_address,
    }),
  };

  // Pass data to client component for interactivity
  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProjectPageClient project={projectWithProfile} />
    </>
  );
}
