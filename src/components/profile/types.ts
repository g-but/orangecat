/**
 * Profile Editor Types
 *
 * Type definitions for ModernProfileEditor and related components.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

import { Profile } from '@/types/profile';
import { ProfileFormData } from '@/types/database';
import { ProfileFieldType } from '@/lib/profile-guidance';
import { LocationMode } from '@/lib/location-privacy';
import { Control } from 'react-hook-form';
import { z } from 'zod';
import { profileSchema } from '@/lib/validation';
import { SocialLink } from '@/types/social';

export type ProfileFormValues = z.infer<typeof profileSchema>;

export interface ModernProfileEditorProps {
  profile: Profile;
  userId: string;
  userEmail?: string;
  onSave: (data: ProfileFormData) => Promise<void>;
  onCancel: () => void;
  useWizard?: boolean;
  onFieldFocus?: (field: ProfileFieldType) => void;
  inline?: boolean;
}

export interface ProfileLocationSectionProps {
  form: {
    control: Control<ProfileFormValues>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue: (name: keyof ProfileFormValues, value: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: (name: keyof ProfileFormValues) => any;
  };
  onFieldFocus?: (field: ProfileFieldType) => void;
  locationMode: LocationMode;
  setLocationMode: (mode: LocationMode) => void;
  locationGroupLabel: string;
  setLocationGroupLabel: (value: string) => void;
}

export interface ProfileBasicSectionProps {
  control: Control<ProfileFormValues>;
  onFieldFocus?: (field: ProfileFieldType) => void;
  locationMode: LocationMode;
  setLocationMode: (mode: LocationMode) => void;
  locationGroupLabel: string;
  setLocationGroupLabel: (value: string) => void;
  form: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue: (name: keyof ProfileFormValues, value: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: (name: keyof ProfileFormValues) => any;
  };
}

export interface OnlinePresenceSectionProps {
  control: Control<ProfileFormValues>;
  onFieldFocus?: (field: ProfileFieldType) => void;
  socialLinks: SocialLink[];
  setSocialLinks: React.Dispatch<React.SetStateAction<SocialLink[]>>;
}

export interface ContactSectionProps {
  control: Control<ProfileFormValues>;
  onFieldFocus?: (field: ProfileFieldType) => void;
  userEmail?: string;
}


