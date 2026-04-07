import { User, MapPin, Calendar } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { isLocationHidden, getLocationGroupLabel } from '@/lib/location-privacy';
import type { Profile } from '@/types/database';

interface BasicInformationCardProps {
  profile: Profile;
}

export default function BasicInformationCard({ profile }: BasicInformationCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Username</div>
              <div className="font-medium text-gray-900">
                {profile.username ? `@${profile.username}` : 'Not set'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Display Name</div>
              <div className="font-medium text-gray-900">{profile.name || 'Not set'}</div>
            </div>
          </div>

          {!isLocationHidden(profile.location_context || '') ? (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-500">Location</div>
                <div className="font-medium text-gray-900">
                  {getLocationGroupLabel(profile.location_context || '') ||
                    profile.location_search ||
                    profile.location ||
                    'Not set'}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-300 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-500">Location</div>
                <div className="font-medium text-gray-400">Hidden</div>
              </div>
            </div>
          )}

          {profile.created_at && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-500">Member Since</div>
                <div className="font-medium text-gray-900">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
