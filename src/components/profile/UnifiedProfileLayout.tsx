'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Edit,
  Bitcoin,
  Globe,
  Users,
  Target,
  Trophy,
  Settings,
  Shield,
  Copy,
  ExternalLink,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ScalableProfile, ProfileFormData } from '@/types/database';
import Button from '@/components/ui/Button';
import DefaultAvatar from '@/components/ui/DefaultAvatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import BitcoinDonationCard from '@/components/bitcoin/BitcoinDonationCard';
import BitcoinWalletStatsCompact from '@/components/bitcoin/BitcoinWalletStatsCompact';
import { ROUTES } from '@/lib/routes';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import ProfileShare from '@/components/sharing/ProfileShare';

interface UnifiedProfileLayoutProps {
  profile: ScalableProfile;
  isOwnProfile: boolean;
  mode?: 'view' | 'edit'; // Kept for compatibility but always 'view' now
  onSave?: (data: ProfileFormData) => Promise<void>;
  onModeChange?: (mode: 'view' | 'edit') => void;
  className?: string;
}

export default function UnifiedProfileLayout({
  profile,
  isOwnProfile,
  mode = 'view', // Always 'view' now - editing is done via ModernProfileEditor modal
  onSave,
  onModeChange,
  className,
}: UnifiedProfileLayoutProps) {
  const router = useRouter();
  const { user } = useAuth();

  // UI states
  const [showQR, setShowQR] = useState<'bitcoin' | 'lightning' | null>(null);
  const [showShare, setShowShare] = useState(false);
  const shareButtonRef = useRef<HTMLDivElement>(null);
  const shareDropdownRef = useRef<HTMLDivElement>(null);

  // Close share dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showShare &&
        shareDropdownRef.current &&
        !shareDropdownRef.current.contains(event.target as Node) &&
        shareButtonRef.current &&
        !shareButtonRef.current.contains(event.target as Node)
      ) {
        setShowShare(false);
      }
    };

    if (showShare) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShare]);

  // Calculate profile completion
  const calculateCompletion = () => {
    const fields = [
      profile.name,
      profile.bio,
      profile.avatar_url,
      profile.banner_url,
      profile.website,
      profile.bitcoin_address,
      profile.lightning_address,
    ];
    const completed = fields.filter(field => field && field.trim()).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Get completion color
  const getCompletionColor = () => {
    if (completionPercentage >= 80) {
      return 'from-green-500 to-emerald-500';
    }
    if (completionPercentage >= 60) {
      return 'from-yellow-500 to-orange-500';
    }
    return 'from-red-500 to-pink-500';
  };

  return (
    <div
      className={cn('min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100', className)}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Banner Section */}
        <div className="relative mb-8">
          {/* Banner */}
          <div className="relative h-80 bg-gradient-to-r from-orange-400 via-orange-500 to-teal-500 rounded-2xl shadow-xl overflow-hidden">
            {/* Banner Image */}
            {profile.banner_url && (
              <Image src={profile.banner_url} alt="Profile banner" fill className="object-cover" />
            )}

            {/* Banner Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-16 left-8">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.name || 'User'}
                width={128}
                height={128}
                className="rounded-2xl object-cover border-4 border-white shadow-2xl"
              />
            ) : (
              <DefaultAvatar size={128} className="rounded-2xl border-4 border-white shadow-2xl" />
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-6 right-6 flex gap-3">
            {/* Share Button - Always visible */}
            <div className="relative" ref={shareButtonRef}>
              <Button
                onClick={() => setShowShare(!showShare)}
                variant="outline"
                className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {showShare && (
                <div ref={shareDropdownRef} className="absolute top-full right-0 mt-2 z-50">
                  <ProfileShare
                    username={profile.username || ''}
                    profileName={profile.name || profile.display_name || profile.username || 'User'}
                    profileBio={profile.bio || undefined}
                    onClose={() => setShowShare(false)}
                  />
                </div>
              )}
            </div>

            {isOwnProfile && (
              <Button
                onClick={() => onModeChange?.('edit')}
                variant="outline"
                className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}

            {!isOwnProfile && (
              <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg">
                <Users className="w-4 h-4 mr-2" />
                Follow
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-20">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile.name || profile.username || 'User'}
                </h1>
                <p className="text-lg text-orange-600 font-medium mb-4">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-gray-600 text-base leading-relaxed mb-4">{profile.bio}</p>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Visit Website
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                )}
              </div>
            </div>

            {/* Bitcoin & Payment Details */}
            {profile.bitcoin_address || profile.lightning_address ? (
              <div className="space-y-4">
                {/* Compact Donation Section */}
                <BitcoinDonationCard
                  bitcoinAddress={profile.bitcoin_address || undefined}
                  lightningAddress={profile.lightning_address || undefined}
                  balance={profile.bitcoin_balance || undefined}
                />

                {/* Wallet Stats - Only show if has bitcoin address */}
                {profile.bitcoin_address && (
                  <BitcoinWalletStatsCompact address={profile.bitcoin_address} />
                )}
              </div>
            ) : (
              isOwnProfile && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
                  <div className="text-center text-gray-500 py-8">
                    <Bitcoin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Accept Bitcoin Donations
                    </h3>
                    <p className="text-sm mb-4">
                      Add your Bitcoin or Lightning address to start receiving donations
                    </p>
                    <Button variant="outline" onClick={() => onModeChange?.('edit')}>
                      <Bitcoin className="w-4 h-4 mr-2" />
                      Add Payment Details
                    </Button>
                  </div>
                </div>
              )
            )}

            {/* Projects List */}
            <ProfileProjectsList userId={profile.id} isOwnProfile={isOwnProfile} />
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
                      ₿{satoshisToBitcoin(profile.total_raised).toFixed(4)}
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

  // Helper function to get status display info
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
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-500" />
          Projects
        </h3>
        <div className="text-gray-500 text-sm">Loading projects...</div>
      </div>
    );
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

          // Only show status badge for non-default statuses (hide 'active' and 'draft')
          const showStatusBadge =
            project.status && !['active', 'draft'].includes(project.status.toLowerCase());

          // Format relative time
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
                  {/* Category Badge */}
                  {project.category && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-xs font-medium text-gray-700">
                        {project.category}
                      </span>
                    </div>
                  )}
                  {/* Status Badge - Only show non-default */}
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
                  {/* Header */}
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
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-gray-900">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
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
                            formatBitcoinDisplay(balanceBTC, 'BTC')
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
