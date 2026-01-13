'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import ProfileShare from '@/components/sharing/ProfileShare';
import { Users, Share2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardInviteCTAProps {
  profile: {
    username?: string | null;
    name?: string | null;
    bio?: string | null;
  } | null;
  userId: string;
}

/**
 * DashboardInviteCTA - Invite friends and share profile section
 */
export function DashboardInviteCTA({ profile, userId }: DashboardInviteCTAProps) {
  const [showShare, setShowShare] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/profiles/${profile?.username || userId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Invite link copied'))
      .catch(() => toast.error('Failed to copy link'));
  };

  return (
    <div className="mb-6">
      <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-teal-50 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Invite friends to OrangeCat
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Share your profile link and start building your network
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 relative">
            <Link href="/dashboard/people" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                <Users className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Discover People</span>
                <span className="sm:hidden">Discover</span>
              </Button>
            </Link>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 relative w-full sm:w-auto">
              <Button
                onClick={() => setShowShare(!showShare)}
                className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
              >
                <Share2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Share My Profile</span>
                <span className="sm:hidden">Share</span>
              </Button>
              <Button variant="outline" onClick={handleCopyLink} className="w-full sm:w-auto">
                <Copy className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Copy Link</span>
                <span className="sm:hidden">Copy</span>
              </Button>
              {showShare && (
                <div className="absolute right-0 top-full mt-2 z-50 w-full sm:w-auto">
                  <ProfileShare
                    username={profile?.username || userId}
                    profileName={profile?.name || profile?.username || 'My Profile'}
                    profileBio={profile?.bio || undefined}
                    onClose={() => setShowShare(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardInviteCTA;
