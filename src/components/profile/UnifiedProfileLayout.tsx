'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Target, Trophy, Settings, Shield, ArrowRight, Bitcoin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ScalableProfile, ProfileFormData } from '@/types/database';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { Wallet } from '@/types/wallet';
import ProfileBanner from '@/components/profile/ProfileBanner';
import ProfileActions from '@/components/profile/ProfileActions';
import ProfileBasicInfo from '@/components/profile/ProfileBasicInfo';
import ProfileWalletSection from '@/components/profile/ProfileWalletSection';
import ProfileErrorBoundary from '@/components/profile/ProfileErrorBoundary';
import Image from 'next/image';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { ProjectsSkeleton } from '@/components/profile/ProfileSkeleton';

interface UnifiedProfileLayoutProps {
  profile: ScalableProfile;
  isOwnProfile: boolean;
  mode?: 'view' | 'edit';
  onSave?: (data: ProfileFormData) => Promise<void>;
  onModeChange?: (mode: 'view' | 'edit') => void;
  className?: string;
}

/**
 * DEPRECATED: UnifiedProfileLayout is being replaced by the unified ProfileLayout component.
 *
 * Use ProfileLayout from '@/components/profile/ProfileLayout' instead.
 * This component will be removed once all references are migrated.
 */
export default function UnifiedProfileLayout({
  profile,
  isOwnProfile,
  mode = 'view',
  onSave,
  onModeChange,
  className,
}: UnifiedProfileLayoutProps) {
  const { user } = useAuth();

  // Data states
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Check follow status on mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user?.id || isOwnProfile || !profile.id) {
        return;
      }

      try {
        const response = await fetch(`/api/social/following/${user.id}`);
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const following = data.data.some((f: any) => f.following_id === profile.id);
          setIsFollowing(following);
        }
      } catch (error) {
        console.error('Failed to check follow status:', error);
      }
    };

    checkFollowStatus();
  }, [user?.id, profile.id, isOwnProfile]);

  // Fetch wallets for this profile
  useEffect(() => {
    const fetchWallets = async () => {
      if (!profile.id) {
        return;
      }

      try {
        setWalletsLoading(true);
        const response = await fetch(`/api/wallets?profile_id=${profile.id}`);
        const data = await response.json();

        // API returns { success: true, data: [...] } (standard response format)
        if (response.ok && Array.isArray(data.data)) {
          setWallets(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch wallets:', error);
      } finally {
        setWalletsLoading(false);
      }
    };

    fetchWallets();
  }, [profile.id]);

  return (
    <div
      className={cn('min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100', className)}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Banner with Actions */}
        <ProfileBanner profile={profile}>
          <ProfileActions
            profileId={profile.id}
            username={profile.username || ''}
            profileName={profile.name || profile.username || 'User'}
            profileBio={profile.bio}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onEditClick={() => onModeChange?.('edit')}
          />
        </ProfileBanner>

        {/* Main Content - Responsive spacing for avatar overlap */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16 sm:mt-20">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <ProfileErrorBoundary>
              <ProfileBasicInfo profile={profile} />
            </ProfileErrorBoundary>

            {/* Bitcoin Wallets Section */}
            <ProfileErrorBoundary>
              <ProfileWalletSection
                wallets={wallets}
                loading={walletsLoading}
                isOwnProfile={isOwnProfile}
                legacyBitcoinAddress={profile.bitcoin_address}
                legacyLightningAddress={profile.lightning_address}
                legacyBalance={profile.bitcoin_balance}
                onEditClick={() => onModeChange?.('edit')}
              />
            </ProfileErrorBoundary>

            {/* Projects List */}
            <ProfileErrorBoundary>
              <ProfileProjectsList userId={profile.id} isOwnProfile={isOwnProfile} />
            </ProfileErrorBoundary>
          </div>

          {/* Right Column - Stats & Actions */}
          <div className="space-y-6">
            {/* Profile Stats */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-500" />
                Profile Stats
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Projects</span>
                  <span className="font-medium">{profile.project_count || 0}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Followers</span>
                  <span className="font-medium">{profile.follower_count || 0}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Following</span>
                  <span className="font-medium">{profile.following_count || 0}</span>
                </div>

                {profile.total_raised && profile.total_raised > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-gray-600">Total Raised</span>
                    <span className="font-medium text-green-600">
                      ₿{(profile.total_raised / 100_000_000).toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {isOwnProfile && mode === 'view' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

                <div className="space-y-3">
                  <Link href="/projects/create" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Target className="w-4 h-4 mr-2" />
                      Create Project
                    </Button>
                  </Link>

                  <Link href="/settings" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </Button>
                  </Link>

                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Profile
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Component to display user's projects
function ProfileProjectsList({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/profiles/${userId}/projects`);
        const result = await response.json();

        if (result.success && result.data) {
          setProjects(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProjects();
    }
  }, [userId]);

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: { label: 'Active', className: 'bg-green-100 text-green-700' },
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
      completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
      paused: { label: 'Paused', className: 'bg-yellow-100 text-yellow-700' },
    };
    return (
      statusMap[status?.toLowerCase()] || {
        label: status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown',
        className: 'bg-gray-100 text-gray-700',
      }
    );
  };

  if (loading) {
    return <ProjectsSkeleton />;
  }

  // Filter out drafts for public display
  const publicProjects = projects.filter(project => project.status?.toLowerCase() !== 'draft');

  if (publicProjects.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-500" />
          Projects
        </h3>
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-4">
            {isOwnProfile ? "You haven't published any projects yet" : 'No projects yet'}
          </p>
          {isOwnProfile && (
            <Link href="/projects/create">
              <Button variant="outline" size="sm">
                <Target className="w-4 h-4 mr-2" />
                Create Your First Project
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-500" />
          Projects ({publicProjects.length})
        </h3>
        {isOwnProfile && (
          <Link href="/dashboard/projects">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>
      <div className="space-y-4">
        {publicProjects.slice(0, 5).map(project => {
          const statusInfo = getStatusInfo(project.status);
          const balanceBTC = project.bitcoin_balance_btc || 0;
          const goalAmount = project.goal_amount || 0;
          const raisedAmount = project.raised_amount || 0;
          const currentAmount = balanceBTC > 0 ? balanceBTC * 100_000_000 : raisedAmount;
          const progress = goalAmount > 0 ? Math.min((currentAmount / goalAmount) * 100, 100) : 0;

          const showStatusBadge =
            project.status && !['active', 'draft'].includes(project.status.toLowerCase());

          const getRelativeTime = (date: string) => {
            const created = new Date(date);
            const now = new Date();
            const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            if (days === 0) {
              return 'Today';
            }
            if (days === 1) {
              return 'Yesterday';
            }
            if (days < 7) {
              return `${days}d ago`;
            }
            if (days < 30) {
              return `${Math.floor(days / 7)}w ago`;
            }
            return created.toLocaleDateString();
          };

          return (
            <Link
              key={project.id}
              href={ROUTES.PROJECTS.VIEW(project.id)}
              className="block overflow-hidden rounded-xl border-2 border-gray-200 hover:border-orange-300 hover:shadow-lg bg-white transition-all duration-200 group"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Thumbnail Image */}
                <div className="relative w-full sm:w-32 h-48 sm:h-auto flex-shrink-0 bg-gradient-to-br from-orange-100 to-amber-100">
                  {(project as any).thumbnail_url ? (
                    <Image
                      src={(project as any).thumbnail_url}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Target className="w-12 h-12 text-orange-400" />
                    </div>
                  )}
                  {project.category && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-xs font-medium text-gray-700">
                        {project.category}
                      </span>
                    </div>
                  )}
                  {showStatusBadge && (
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg mb-1.5 group-hover:text-orange-600 transition-colors line-clamp-1">
                      {project.title}
                    </h4>
                    {project.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {/* Progress Section */}
                  {goalAmount > 0 ? (
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-gray-900">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-amber-500 h-2.5 sm:h-3 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                          role="progressbar"
                          aria-valuenow={progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Project funding progress: ${progress.toFixed(1)}%`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">
                          <CurrencyDisplay
                            amount={currentAmount}
                            currency={project.currency || 'SATS'}
                            size="sm"
                          />
                        </span>
                        <span className="text-gray-500">
                          of{' '}
                          <CurrencyDisplay
                            amount={goalAmount}
                            currency={project.currency || 'SATS'}
                            size="sm"
                          />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <Bitcoin className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-semibold text-gray-900">
                          {balanceBTC > 0 ? (
                            `${balanceBTC.toFixed(8)} BTC`
                          ) : raisedAmount > 0 ? (
                            <CurrencyDisplay
                              amount={raisedAmount}
                              currency={project.currency || 'SATS'}
                              size="sm"
                            />
                          ) : (
                            'No funds yet'
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span>{getRelativeTime(project.created_at)}</span>
                    {project.bitcoin_address && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <Bitcoin className="w-3 h-3" />
                        Wallet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {publicProjects.length > 5 && (
          <Link
            href={isOwnProfile ? '/dashboard/projects' : `#`}
            className="block text-center text-sm text-orange-600 hover:text-orange-700 font-medium py-3 rounded-lg hover:bg-orange-50 transition-colors"
          >
            View {publicProjects.length - 5} more projects →
          </Link>
        )}
      </div>
    </div>
  );
}
