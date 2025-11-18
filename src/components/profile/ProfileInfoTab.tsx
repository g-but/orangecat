'use client';

import { Profile } from '@/types/database';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import {
  User,
  MapPin,
  Globe,
  Calendar,
  Bitcoin,
  Zap,
  Mail,
  Heart,
  Sparkles,
  Edit
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useState } from 'react';

interface ProfileInfoTabProps {
  profile: Profile;
  isOwnProfile: boolean;
}

/**
 * ProfileInfoTab Component
 *
 * Displays detailed profile information in a structured format.
 * Shows all profile fields including personal details, location, story, and contact info.
 */
export default function ProfileInfoTab({ profile, isOwnProfile }: ProfileInfoTabProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Personal Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" />
            Personal Details
          </h3>
          {isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Display Name */}
            {profile.name && (
              <div>
                <label className="text-sm font-medium text-gray-500">Display Name</label>
                <p className="text-gray-900 mt-1">{profile.name}</p>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="text-sm font-medium text-gray-500">Username</label>
              <p className="text-gray-900 mt-1">@{profile.username || 'Not set'}</p>
            </div>

            {/* Member Since */}
            {profile.created_at && (
              <div>
                <label className="text-sm font-medium text-gray-500">Member Since</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="pt-4 border-t">
              <label className="text-sm font-medium text-gray-500">Bio</label>
              <p className="text-gray-900 mt-2 whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location */}
      {(profile.location_city || profile.location_country) && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500" />
              Location
            </h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-gray-900">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>
                {[profile.location_city, profile.location_country]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
            {profile.location_zip && (
              <p className="text-sm text-gray-500 mt-2">ZIP: {profile.location_zip}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Background & Story */}
      {(profile.background || profile.inspiration_statement) && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Heart className="w-5 h-5 text-gray-500" />
              My Story
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.background && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Background
                </label>
                <p className="text-gray-900 mt-2 whitespace-pre-wrap">{profile.background}</p>
              </div>
            )}

            {profile.inspiration_statement && (
              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  What Inspires Me
                </label>
                <p className="text-gray-900 mt-2 whitespace-pre-wrap">
                  {profile.inspiration_statement}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contact & Links */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-500" />
            Contact & Links
          </h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Website */}
          {profile.website && (
            <div className="flex items-center gap-3 text-gray-700">
              <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          {/* Email (if public) */}
          {profile.email && (
            <div className="flex items-center gap-3 text-gray-700">
              <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <a
                href={`mailto:${profile.email}`}
                className="text-blue-600 hover:underline break-all"
              >
                {profile.email}
              </a>
            </div>
          )}

          {!profile.website && !profile.email && (
            <p className="text-gray-500 text-sm italic">No contact information provided</p>
          )}
        </CardContent>
      </Card>

      {/* Payment Addresses */}
      {(profile.bitcoin_address || profile.lightning_address) && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bitcoin className="w-5 h-5 text-orange-500" />
              Payment Addresses
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Bitcoin Address */}
            {profile.bitcoin_address && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">
                  Bitcoin Address
                </label>
                <div className="flex items-center gap-3 text-gray-700 bg-gray-50 p-3 rounded-lg">
                  <Bitcoin className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <code className="text-sm font-mono flex-1 overflow-x-auto">
                    {profile.bitcoin_address}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(profile.bitcoin_address || '');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}

            {/* Lightning Address */}
            {profile.lightning_address && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">
                  Lightning Address
                </label>
                <div className="flex items-center gap-3 text-gray-700 bg-gray-50 p-3 rounded-lg">
                  <Zap className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <code className="text-sm flex-1 overflow-x-auto">
                    {profile.lightning_address}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(profile.lightning_address || '');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Modal would go here if needed */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <p className="text-gray-600 mb-4">
              Profile editing will redirect to the profile editor page.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  window.location.href = '/settings/profile';
                }}
              >
                Go to Profile Settings
              </Button>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
