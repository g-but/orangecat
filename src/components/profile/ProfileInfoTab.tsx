'use client';

import { useState } from 'react';
import { Profile as DatabaseProfile, ProfileFormData } from '@/types/database';
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
  Clock,
  Edit as EditIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';
import ModernProfileEditor from './ModernProfileEditor';

interface ProfileInfoTabProps {
  profile: DatabaseProfile & { email?: string | null };
  isOwnProfile?: boolean;
  userId?: string;
  userEmail?: string;
  onSave?: (data: ProfileFormData) => Promise<void>;
}

/**
 * ProfileInfoTab Component
 *
 * Shows detailed profile information including location, join date,
 * social links, and other metadata. Supports in-place editing for own profile.
 *
 * Best Practices:
 * - DRY: Reusable info display and edit mode
 * - Modular: Separate from overview, integrates ModernProfileEditor
 * - Progressive: Lazy loaded on first click
 * - Mobile-first: Edit in context without navigation
 */
export default function ProfileInfoTab({
  profile,
  isOwnProfile = false,
  userId,
  userEmail,
  onSave,
}: ProfileInfoTabProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const joinDate = profile.created_at ? new Date(profile.created_at) : null;
  const lastActive = profile.updated_at ? new Date(profile.updated_at) : null;

  // Handle save from editor
  const handleSave = async (data: ProfileFormData) => {
    if (onSave) {
      try {
        await onSave(data);
        // Only switch back to view mode if save succeeded
        setMode('view');
      } catch (error) {
        // Error is already handled by onSave (toast shown)
        // Stay in edit mode so user can try again
        console.error('Failed to save profile:', error);
      }
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    setMode('view');
  };

  // If in edit mode and we have required props, show editor
  if (mode === 'edit' && isOwnProfile && userId && onSave) {
    return (
      <div className="space-y-6">
        <ModernProfileEditor
          profile={profile as any}
          userId={userId}
          userEmail={userEmail}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // View mode
  return (
    <div className="space-y-6">
      {/* Edit Button (only for own profile) */}
      {isOwnProfile && userId && onSave && (
        <div className="flex justify-end">
          <Button onClick={() => setMode('edit')} variant="outline">
            <EditIcon className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      )}

      {/* Profile Details Card */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-500" />
            Profile Information
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bio - Show prominently first */}
          {profile.bio && (
            <div className="pb-4 border-b border-gray-200">
              <div className="text-sm text-gray-500 mb-2">About</div>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
            </div>
          )}

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
          {(profile.location_search || profile.location) && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-500">Location</div>
                <div className="font-medium text-gray-900">
                  {profile.location_search || profile.location}
                </div>
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
                <div className="font-medium text-gray-900">{format(joinDate, 'MMMM d, yyyy')}</div>
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
