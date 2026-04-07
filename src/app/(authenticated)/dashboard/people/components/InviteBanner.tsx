import Link from 'next/link';
import Button from '@/components/ui/Button';
import ProfileShare from '@/components/sharing/ProfileShare';
import { Search, Share2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface InviteBannerProps {
  showShare: boolean;
  onToggleShare: () => void;
  onCloseShare: () => void;
  profileUrl: string;
  profileUsername: string;
  profileName: string;
  profileBio?: string;
}

export default function InviteBanner({
  showShare,
  onToggleShare,
  onCloseShare,
  profileUrl,
  profileUsername,
  profileName,
  profileBio,
}: InviteBannerProps) {
  return (
    <div className="mb-6">
      <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-teal-50 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-semibold text-gray-900">Invite friends to OrangeCat</h3>
            <p className="text-sm text-gray-600">
              Share your profile link and start building your network
            </p>
          </div>
          <div className="flex items-center gap-2 relative">
            <Link href="/discover?section=people">
              <Button variant="outline">
                <Search className="w-4 h-4 mr-2" /> Discover People
              </Button>
            </Link>
            <div className="flex items-center gap-2 relative">
              <Button
                onClick={onToggleShare}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Share2 className="w-4 h-4 mr-2" /> Share My Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard
                    .writeText(profileUrl)
                    .then(() => {
                      toast.success('Invite link copied');
                    })
                    .catch(() => toast.error('Failed to copy link'));
                }}
              >
                <Copy className="w-4 h-4 mr-2" /> Copy Link
              </Button>
              {showShare && (
                <div className="absolute right-0 mt-2 z-50">
                  <ProfileShare
                    username={profileUsername}
                    profileName={profileName}
                    profileBio={profileBio}
                    onClose={onCloseShare}
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
