'use client';

import { ROUTES } from '@/lib/routes';
import ShareContent from './ShareContent';

interface ProfileShareProps {
  username: string;
  profileName: string;
  profileBio?: string;
  currentUrl?: string;
  onClose?: () => void;
  variant?: 'dropdown' | 'modal';
  className?: string;
}

/**
 * ProfileShare Component
 * 
 * Wrapper around ShareContent for profile-specific sharing.
 * DRY: Uses reusable ShareContent component.
 */
export default function ProfileShare({
  username,
  profileName,
  profileBio = '',
  currentUrl,
  onClose,
  variant: _variant = 'dropdown',
  className = '',
}: ProfileShareProps) {
  // Construct the profile URL
  const profileUrl =
    currentUrl ||
    `${typeof window !== 'undefined' ? window.location.origin : 'https://orangecat.ch'}${ROUTES.PROFILES.VIEW(username)}`;

  // Create optimized share text
  const shareTitle = `${profileName} on OrangeCat`;
  const shareDescription =
    profileBio || `Check out ${profileName}'s profile on OrangeCat - Bitcoin fundraising platform`;

  return (
    <ShareContent
      title={shareTitle}
      description={shareDescription}
      url={profileUrl}
      onClose={onClose}
      className={className}
      titleText="Share Profile"
    />
  );
}
