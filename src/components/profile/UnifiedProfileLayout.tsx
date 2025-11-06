'use client';

import { useState, useEffect } from 'react';
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

  if (projects.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-500" />
          Projects
        </h3>
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-4">
            {isOwnProfile ? "You haven't created any projects yet" : 'No projects yet'}
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
          Projects ({projects.length})
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
        {projects.slice(0, 5).map(project => {
          const statusInfo = getStatusInfo(project.status);
          const balanceBTC = project.bitcoin_balance_btc || 0;
          const goalAmount = project.goal_amount || 0;
          const progress = goalAmount > 0 ? Math.min((balanceBTC / goalAmount) * 100, 100) : 0;
          const raisedAmount = project.raised_amount || 0;
          const displayAmount = balanceBTC > 0 ? balanceBTC : raisedAmount;

          return (
            <Link
              key={project.id}
              href={ROUTES.PROJECTS.VIEW(project.id)}
              className="block p-5 rounded-xl border-2 border-gray-200 hover:border-orange-300 hover:shadow-lg bg-white transition-all duration-200 group"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-orange-600 transition-colors">
                      {project.title}
                    </h4>
                    {project.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusInfo.className}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                {/* Progress Bar */}
                {goalAmount > 0 && (
                  <div className="space-y-1">
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
                  </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  {/* Balance */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Wallet Balance</div>
                    <div className="flex items-center gap-1.5">
                      <Bitcoin className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold text-gray-900">
                        {balanceBTC > 0 ? formatBitcoinDisplay(balanceBTC, 'BTC') : '—'}
                      </span>
                    </div>
                    {balanceBTC === 0 && raisedAmount > 0 && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        <CurrencyDisplay
                          amount={raisedAmount}
                          currency={project.currency || 'SATS'}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Goal */}
                  {goalAmount > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Goal</div>
                      <div className="font-semibold text-gray-900">
                        <CurrencyDisplay
                          amount={goalAmount}
                          currency={project.currency || 'SATS'}
                          size="sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                  {project.bitcoin_address && (
                    <span className="flex items-center gap-1">
                      <Bitcoin className="w-3 h-3" />
                      Wallet configured
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
        {projects.length > 5 && (
          <Link
            href={isOwnProfile ? '/dashboard/projects' : `#`}
            className="block text-center text-sm text-orange-600 hover:text-orange-700 font-medium py-3 rounded-lg hover:bg-orange-50 transition-colors"
          >
            View {projects.length - 5} more projects →
          </Link>
        )}
      </div>
    </div>
  );
}
