import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import ProfilePageClient from '@/components/profile/ProfilePageClient';
import { DATABASE_TABLES } from '@/config/database-tables';

interface PageProps {
  params: Promise<{ username: string }>;
}

/**
 * Generate metadata for public profile pages
 * This enables SEO and social media preview cards
 *
 * Handles /profiles/me by resolving to the actual username
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createServerClient();

  // Handle /profiles/me → resolve to actual username
  let targetUsername = username;
  if (username === 'me') {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Get username for current user
      const { data: userProfile } = await supabase
        .from(DATABASE_TABLES.PROFILES)
        .select('username')
        .eq('id', user.id)
        .single();

      targetUsername = userProfile?.username || user.id;
    } else {
      // Not authenticated - return generic metadata
      return {
        title: 'My Profile | OrangeCat',
        description: 'View your profile on OrangeCat. Support Bitcoin fundraising projects.',
      };
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, bio, avatar_url, username')
    .eq('username', targetUsername)
    .single();

  if (!profile) {
    return {
      title: 'Profile Not Found | OrangeCat',
      description: 'The profile you are looking for does not exist.',
    };
  }

  const displayName = profile.name || profile.username || targetUsername;
  const description =
    profile.bio ||
    `View ${displayName}'s profile on OrangeCat. Support their Bitcoin fundraising projects.`;
  const image = profile.avatar_url || '/images/og-default.png';
  // Use actual username in URL, not "me" for better SEO
  const url = `https://orangecat.ch/profiles/${profile.username || targetUsername}`;

  return {
    title: `${displayName} | OrangeCat`,
    description,
    alternates: {
      canonical: url,
    },
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
 * - Supports /profiles/me for current user's profile
 */
export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createServerClient();

  // Handle /profiles/me → load current user
  let targetUsername = username;
  if (username === 'me') {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      // Not authenticated, redirect to login
      redirect('/auth?redirect=/profiles/me');
    }

    // Get username for current user
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    targetUsername = userProfile?.username || user.id;
  }

  // Fetch profile data server-side
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', targetUsername)
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

  // Fetch follower count
  const { count: followerCount } = await supabase
        .from(DATABASE_TABLES.FOLLOWS)
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id);

  // Fetch following count
  const { count: followingCount } = await supabase
        .from(DATABASE_TABLES.FOLLOWS)
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id);

  // Fetch wallet count using new wallet architecture
  let walletCount = 0;
  try {
    // Use the get_entity_wallets function to get active wallets for this profile
    const { data: walletData } = await supabase.rpc('get_entity_wallets', {
      p_entity_type: 'profile',
      p_entity_id: profile.id,
    });
    walletCount = walletData ? walletData.filter((w: any) => w.is_active).length : 0;
  } catch (error) {
    // Fallback: try querying wallet_ownerships table directly
    try {
      const { count } = await supabase
        .from('wallet_ownerships')
        .select('*', { count: 'exact', head: true })
        .eq('owner_type', 'profile')
        .eq('owner_id', profile.id)
        .eq('is_active', true);
      walletCount = count || 0;
    } catch (fallbackError) {
      // If both fail, wallets table might not be migrated yet
      console.log('Wallet architecture not available');
    }
  }

  // Calculate statistics
  const projectCount = projects?.length || 0;
  const totalRaised = projects?.reduce((sum, p) => sum + (Number(p.raised_amount) || 0), 0) || 0;

  // Generate JSON-LD structured data for SEO
  // Use actual username in URL, not "me" for better SEO
  const canonicalUsername = profile.username || targetUsername;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name || profile.username || canonicalUsername,
    alternateName: profile.username || undefined,
    description: profile.bio || undefined,
    image: profile.avatar_url || undefined,
    url: `https://orangecat.ch/profiles/${canonicalUsername}`,
    sameAs: profile.website ? [profile.website] : undefined,
    ...(profile.bitcoin_address && {
      paymentAccepted: 'Bitcoin',
      bitcoinAddress: profile.bitcoin_address,
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
      <ProfilePageClient
        profile={profile}
        projects={projects || []}
        stats={{
          projectCount,
          totalRaised,
          followerCount: followerCount || 0,
          followingCount: followingCount || 0,
          walletCount,
        }}
      />
    </>
  );
}
