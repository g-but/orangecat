import Link from 'next/link';
import { User, Mail, Phone } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { ROUTES } from '@/config/routes';
import type { Profile } from '@/types/database';

interface InfoSidebarProps {
  profile: Profile;
  userEmail?: string;
}

export default function InfoSidebar({ profile, userEmail }: InfoSidebarProps) {
  const publicContactEmail = profile.contact_email || profile.email;

  return (
    <div className="xl:col-span-1 space-y-4 sm:space-y-6">
      {/* Contact Information */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Registration Email</div>
              <div className="font-medium text-gray-900 break-all">
                {profile.email || userEmail || 'Unknown'}
              </div>
              <p className="mt-1 text-xs text-gray-500">Used for account login and security</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Public Contact Email</div>
              {publicContactEmail ? (
                <a
                  href={`mailto:${publicContactEmail}`}
                  className="font-medium text-blue-600 hover:underline break-all"
                >
                  {publicContactEmail}
                </a>
              ) : (
                <div className="text-gray-400 italic">Not set</div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Phone</div>
              {profile.phone ? (
                <a
                  href={`tel:${profile.phone}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {profile.phone}
                </a>
              ) : (
                <div className="text-gray-400 italic">Not set</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold text-gray-900">Account Status</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Email Verified</span>
            <span className={profile.email ? 'text-green-600 font-medium' : 'text-gray-400'}>
              {profile.email ? '\u2713 Verified' : 'Not verified'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Profile Complete</span>
            <span className="text-green-600 font-medium">
              {profile.bio && profile.avatar_url ? '\u2713 Complete' : 'In Progress'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            {profile.username && (
              <Link href={`/profiles/${profile.username}`}>
                <Button variant="outline" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  View Public Profile
                </Button>
              </Link>
            )}
            <Link href={ROUTES.DASHBOARD.WALLETS}>
              <Button variant="outline" className="w-full justify-start">
                Manage Wallets
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
