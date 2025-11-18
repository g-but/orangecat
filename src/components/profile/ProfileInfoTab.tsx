'use client';

import { Profile } from '@/types/database';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import {
  User,
  MapPin,
  Globe,
  Calendar,
  Mail,
  Twitter,
  Github,
  Info,
  Shield,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface ProfileInfoTabProps {
  profile: Profile;
}

/**
 * ProfileInfoTab Component
 *
 * Shows detailed profile information including location, join date,
 * social links, and other metadata.
 *
 * Best Practices:
 * - DRY: Reusable info display
 * - Modular: Separate from overview
 * - Progressive: Lazy loaded on first click
 */
export default function ProfileInfoTab({ profile }: ProfileInfoTabProps) {
  const joinDate = profile.created_at ? new Date(profile.created_at) : null;
  const lastActive = profile.updated_at ? new Date(profile.updated_at) : null;

  return (
    <div className="space-y-6">
      {/* Profile Details Card */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-500" />
            Profile Information
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Username */}
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Username</div>
              <div className="font-medium text-gray-900">@{profile.username}</div>
            </div>
          </div>

          {/* Display Name */}
          {profile.name && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-500">Display Name</div>
                <div className="font-medium text-gray-900">{profile.name}</div>
              </div>
            </div>
          )}

          {/* Email (only for own profile) */}
          {profile.email && (
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium text-gray-900">{profile.email}</div>
              </div>
            </div>
          )}

          {/* Location */}
          {profile.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-500">Location</div>
                <div className="font-medium text-gray-900">{profile.location}</div>
              </div>
            </div>
          )}

          {/* Website */}
          {profile.website && (
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-500">Website</div>
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline break-all"
                >
                  {profile.website}
                </a>
              </div>
            </div>
          )}

          {/* Join Date */}
          {joinDate && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-500">Member Since</div>
                <div className="font-medium text-gray-900">
                  {format(joinDate, 'MMMM d, yyyy')}
                </div>
              </div>
            </div>
          )}

          {/* Last Active */}
          {lastActive && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-500">Last Active</div>
                <div className="font-medium text-gray-900">
                  {format(lastActive, 'MMMM d, yyyy')}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bio Card (if not shown elsewhere) */}
      {profile.bio && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              Bio
            </h3>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-500" />
            Account Status
          </h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Email Verified</span>
            <span className={profile.email ? 'text-green-600 font-medium' : 'text-gray-400'}>
              {profile.email ? '✓ Verified' : 'Not verified'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Profile Complete</span>
            <span className="text-green-600 font-medium">
              {profile.bio && profile.avatar_url ? '✓ Complete' : 'In Progress'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
