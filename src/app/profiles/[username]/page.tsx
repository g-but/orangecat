import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import PublicProfileClient from '@/components/profile/PublicProfileClient';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ username: string }>;
}

/**
 * Generate metadata for public profile pages
 * This enables SEO and social media preview cards
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, bio, avatar_url, username')
    .eq('username', username)
    .single();

  if (!profile) {
    return {
      title: 'Profile Not Found | OrangeCat',
      description: 'The profile you are looking for does not exist.',
    };
  }

  const displayName =
    (profile as any).name || (profile as any).display_name || profile.username || username;
  const description =
    profile.bio ||
    `View ${displayName}'s profile on OrangeCat. Support their Bitcoin fundraising projects.`;
  const image = profile.avatar_url || '/images/og-default.png';
  const url = `https://orangecat.ch/profiles/${username}`;

  return {
    title: `${displayName} | OrangeCat`,
    description,
    openGraph: {
      title: `${displayName} on OrangeCat`,
      description,
      images: [image],
      url,
      type: 'profile',
      siteName: 'OrangeCat',
    },
    twitter: {
      card: 'summary',
      title: displayName,
      description,
      images: [image],
    },
  };
}

/**
 * Public Profile Page - Server Component
 *
 * This page is publicly accessible and server-side rendered for:
 * - SEO optimization
 * - Social media preview cards
 * - Fast initial page load
 */
export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createServerClient();

  // Fetch profile data server-side
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // Fetch user's projects (exclude drafts from public view)
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select(
      `
      id,
      title,
      description,
      category,
      tags,
      status,
      bitcoin_address,
      lightning_address,
      goal_amount,
      currency,
      raised_amount,
      created_at,
      updated_at
    `
    )
    .eq('user_id', profile.id)
    .neq('status', 'draft') // Exclude drafts from public profile
    .order('created_at', { ascending: false });

  // Calculate statistics
  const projectCount = projects?.length || 0;
  const totalRaised = projects?.reduce((sum, p) => sum + (Number(p.raised_amount) || 0), 0) || 0;

  // Pass data to client component for interactivity
  return (
    <PublicProfileClient
      profile={profile}
      projects={projects || []}
      stats={{
        projectCount,
        totalRaised,
      }}
    />
  );
}
