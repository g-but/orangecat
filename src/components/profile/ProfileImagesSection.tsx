/**
 * ProfileImagesSection Component
 *
 * Handles avatar and banner image uploads for profile editing.
 * Extracted from ModernProfileEditor for better modularity.
 *
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Extracted from ModernProfileEditor component
 */

import { User, Camera } from 'lucide-react';
import { Profile } from '@/types/profile';

interface ProfileImagesSectionProps {
  profile: Profile;
  avatarPreview: string | null;
  bannerPreview: string | null;
  avatarInputRef: React.RefObject<HTMLInputElement>;
  bannerInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (file: File, type: 'avatar' | 'banner') => Promise<void>;
}

export function ProfileImagesSection({
  profile,
  avatarPreview,
  bannerPreview,
  avatarInputRef,
  bannerInputRef,
  handleFileUpload,
}: ProfileImagesSectionProps) {
  return (
    <div className="space-y-4">
      {/* Banner Upload */}
      <div className="relative">
        <div
          className="relative h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer overflow-hidden"
          onClick={() => bannerInputRef.current?.click()}
        >
          {bannerPreview || profile.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- Dynamic banner preview
            <img
              src={bannerPreview || profile.banner_url || ''}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" data-testid="camera-icon" />
                <p className="text-sm text-gray-500">Add banner photo</p>
              </div>
            </div>
          )}
        </div>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'banner')}
          className="hidden"
        />
      </div>

      {/* Avatar Upload */}
      <div className="flex items-start gap-4">
        <div
          className="relative w-20 h-20 bg-gray-100 rounded-full border-2 border-gray-300 cursor-pointer overflow-hidden flex-shrink-0"
          onClick={() => avatarInputRef.current?.click()}
        >
          {avatarPreview || profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- Dynamic avatar preview
            <img
              src={avatarPreview || profile.avatar_url || ''}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <User className="w-8 h-8 text-gray-400" data-testid="camera-icon" />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center rounded-full">
            <Camera className="w-5 h-5 text-white opacity-0 hover:opacity-100" />
          </div>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'avatar')}
          className="hidden"
        />
      </div>
    </div>
  );
}



