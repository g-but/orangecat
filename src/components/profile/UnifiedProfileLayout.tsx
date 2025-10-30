'use client';

import { useState } from 'react';
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
  Zap,
  QrCode,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ScalableProfile, ProfileFormData } from '@/types/database';
import Button from '@/components/ui/Button';
import DefaultAvatar from '@/components/ui/DefaultAvatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import BitcoinWalletStats from '@/components/bitcoin/BitcoinWalletStats';

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
              <div className="space-y-6">
                {/* Donation Section */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-xl border-2 border-orange-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Bitcoin className="w-6 h-6 text-orange-500" />
                      Accept Donations
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bitcoin Address */}
                    {profile.bitcoin_address && (
                      <div className="bg-white rounded-xl p-5 shadow-md border border-orange-100">
                        <div className="flex items-center gap-2 mb-4">
                          <Bitcoin className="w-5 h-5 text-orange-500" />
                          <h4 className="font-semibold text-gray-900">Bitcoin</h4>
                        </div>

                        {/* QR Code */}
                        <div className="flex justify-center mb-4">
                          <div className="bg-white p-3 rounded-lg border-2 border-gray-200">
                            <QRCodeSVG
                              value={`bitcoin:${profile.bitcoin_address}`}
                              size={160}
                              level="H"
                              includeMargin={false}
                            />
                          </div>
                        </div>

                        {/* Address */}
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-1">Address</div>
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <code className="text-xs font-mono text-gray-900 break-all">
                              {profile.bitcoin_address}
                            </code>
                          </div>
                        </div>

                        {/* Copy Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(profile.bitcoin_address!, 'Bitcoin address')
                          }
                          className="w-full"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Address
                        </Button>
                      </div>
                    )}

                    {/* Lightning Address */}
                    {profile.lightning_address && (
                      <div className="bg-white rounded-xl p-5 shadow-md border border-yellow-100">
                        <div className="flex items-center gap-2 mb-4">
                          <Zap className="w-5 h-5 text-yellow-500" />
                          <h4 className="font-semibold text-gray-900">Lightning</h4>
                        </div>

                        {/* QR Code */}
                        <div className="flex justify-center mb-4">
                          <div className="bg-white p-3 rounded-lg border-2 border-gray-200">
                            <QRCodeSVG
                              value={profile.lightning_address}
                              size={160}
                              level="H"
                              includeMargin={false}
                            />
                          </div>
                        </div>

                        {/* Address */}
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-1">Address</div>
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <code className="text-xs font-mono text-gray-900 break-all">
                              {profile.lightning_address}
                            </code>
                          </div>
                        </div>

                        {/* Copy Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(profile.lightning_address!, 'Lightning address')
                          }
                          className="w-full"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Address
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bitcoin Wallet Stats - Only show if Bitcoin address exists */}
                {profile.bitcoin_address && (
                  <BitcoinWalletStats address={profile.bitcoin_address} />
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
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Following</span>
                  <span className="font-medium">{profile.following_count || 0}</span>
                </div>

                {profile.total_raised && profile.total_raised > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-gray-600">Total Raised</span>
                    <span className="font-medium text-green-600">
                      ₿{(profile.total_raised / 100000000).toFixed(4)}
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
