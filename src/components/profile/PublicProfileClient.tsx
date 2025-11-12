'use client';

import { useAuth } from '@/hooks/useAuth';
import UnifiedProfileLayout from '@/components/profile/UnifiedProfileLayout';
import { Profile } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, ExternalLink, Bitcoin, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';

interface Project {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  goal_amount: number | null;
  currency: string;
  raised_amount: number | null;
  created_at: string;
}

interface PublicProfileClientProps {
  profile: Profile;
  projects: Project[];
  stats: {
    projectCount: number;
    totalRaised: number;
  };
}

/**
 * Public Profile Client Component
 *
 * Handles client-side interactivity for public profile pages.
 * The server component handles data fetching and SEO.
 */
export default function PublicProfileClient({
  profile,
  projects,
  stats,
}: PublicProfileClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isOwnProfile = profile.id === user?.id;

  // Convert profile to ScalableProfile format expected by UnifiedProfileLayout
  const scalableProfile = {
    ...profile,
    name: profile.name || profile.username || '',
  } as any; // Type assertion needed due to interface differences

  // Check if profile has wallet addresses for support
  const hasWallet = !!(profile.bitcoin_address || profile.lightning_address);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Use UnifiedProfileLayout for consistent UI */}
      <UnifiedProfileLayout profile={scalableProfile} isOwnProfile={isOwnProfile} mode="view" />

      {/* Support CTA for non-own profiles with wallets */}
      {!isOwnProfile && hasWallet && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <Card className="bg-gradient-to-r from-orange-50 to-teal-50 border-2 border-orange-200">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Support {scalableProfile.name || profile.username}
                  </h3>
                  <p className="text-gray-600">
                    Send Bitcoin directly to support their work and projects
                  </p>
                </div>
                <div className="flex gap-3">
                  {profile.bitcoin_address && (
                    <Button
                      onClick={() => {
                        // Scroll to Bitcoin donation card
                        const element = document.querySelector('[data-bitcoin-card]');
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Bitcoin className="w-4 h-4 mr-2" />
                      Send Bitcoin
                    </Button>
                  )}
                  {profile.lightning_address && (
                    <Button
                      onClick={() => {
                        // Scroll to Lightning donation card
                        const element = document.querySelector('[data-lightning-card]');
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      variant="outline"
                      className="border-yellow-400 hover:bg-yellow-50"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Send Lightning
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Projects Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Projects ({stats.projectCount})</h2>
          {stats.totalRaised > 0 && (
            <p className="text-gray-600">
              Total raised: <CurrencyDisplay amount={stats.totalRaised} currency="SATS" />
            </p>
          )}
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">
                {isOwnProfile
                  ? "You haven't created any public projects yet."
                  : "This person hasn't created any public projects yet."}
              </p>
              {isOwnProfile && (
                <Link href={ROUTES.PROJECTS.CREATE}>
                  <Button>Create Your First Project</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => {
              const progress = project.goal_amount
                ? Math.round(
                    (Number(project.raised_amount || 0) / Number(project.goal_amount)) * 100
                  )
                : 0;

              return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                      {project.category && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full ml-2">
                          {project.category}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {project.description}
                      </p>
                    )}

                    {project.goal_amount && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-teal-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>
                            <CurrencyDisplay
                              amount={Number(project.raised_amount || 0)}
                              currency={project.currency}
                            />
                          </span>
                          <span>
                            <CurrencyDisplay
                              amount={Number(project.goal_amount)}
                              currency={project.currency}
                            />
                          </span>
                        </div>
                      </div>
                    )}

                    <Link href={ROUTES.PROJECTS.VIEW(project.id)}>
                      <Button variant="outline" className="w-full">
                        View Project
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
