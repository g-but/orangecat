import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import ProjectPageClient from '@/components/project/ProjectPageClient';
import { notFound } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

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
    (creatorProfile as any)?.display_name ||
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

  // Pass data to client component for interactivity
  return <ProjectPageClient project={projectWithProfile} />;
}
