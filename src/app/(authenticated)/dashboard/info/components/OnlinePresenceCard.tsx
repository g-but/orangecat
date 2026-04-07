import { Globe, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { SocialLinksDisplay } from '@/components/profile/SocialLinksDisplay';
import type { Profile } from '@/types/database';
import type { SocialLink } from '@/types/social';

interface OnlinePresenceCardProps {
  profile: Profile;
  socialLinks: SocialLink[];
}

export default function OnlinePresenceCard({ profile, socialLinks }: OnlinePresenceCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <h3 className="text-lg font-semibold text-gray-900">Online Presence</h3>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="flex items-start gap-3">
          <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm text-gray-500">Website</div>
            {profile.website ? (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline flex items-center gap-1"
              >
                {profile.website.replace(/^https?:\/\//, '')}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <div className="text-gray-400 italic">Not set</div>
            )}
          </div>
        </div>

        <div>
          {socialLinks.length > 0 ? (
            <SocialLinksDisplay links={socialLinks} />
          ) : (
            <div className="text-gray-400 italic">No social links added</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
