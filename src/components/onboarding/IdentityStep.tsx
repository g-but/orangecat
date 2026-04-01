'use client';

/**
 * Step 1: Identity - username, display name, and avatar.
 * Required step for profile completion.
 */

import Input from '@/components/ui/Input';
import { ProfileUploadSection } from '@/components/profile/ProfileUploadSection';
import { User } from 'lucide-react';

interface IdentityStepProps {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  errors: Record<string, string>;
  onUsernameChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onAvatarUpload: (url: string) => void;
}

export function IdentityStep({
  userId,
  username,
  displayName,
  avatarUrl,
  errors,
  onUsernameChange,
  onDisplayNameChange,
  onAvatarUpload,
}: IdentityStepProps) {
  return (
    <div className="space-y-5">
      {/* Avatar upload */}
      <div className="flex justify-center">
        <ProfileUploadSection
          userId={userId}
          avatarUrl={avatarUrl || undefined}
          onAvatarUpload={onAvatarUpload}
          className="flex-shrink-0"
        />
      </div>

      <Input
        label="Username"
        description="This is your unique handle on OrangeCat"
        value={username}
        onChange={e => onUsernameChange(e.target.value)}
        error={errors.username}
        placeholder="satoshi"
        icon={User}
        required
        maxLength={30}
      />

      <Input
        label="Display Name"
        description="How your Cat will introduce you to others"
        value={displayName}
        onChange={e => onDisplayNameChange(e.target.value)}
        error={errors.displayName}
        placeholder="Satoshi Nakamoto"
        required
        maxLength={100}
      />
    </div>
  );
}
