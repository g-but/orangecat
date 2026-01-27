/**
 * PROFILE WIZARD TYPES
 * Shared types for the profile wizard
 */

import { z } from 'zod';
import type { Profile } from '@/types/profile';
import type { ProfileFormData } from '@/types/database';
import { profileSchema } from '@/lib/validation';

export type ProfileFormValues = z.infer<typeof profileSchema>;

export interface ProfileWizardProps {
  profile: Profile;
  userId: string;
  userEmail: string;
  onSave: (data: ProfileFormData) => Promise<void>;
  onCancel: () => void;
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  fields: string[];
  required: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface WizardState {
  currentStep: number;
  isSaving: boolean;
}

export interface WizardActions {
  handleNext: () => Promise<void>;
  handlePrevious: () => void;
  handleSave: () => Promise<void>;
  canProceed: () => boolean;
  calculateProgress: () => number;
  getStepProgress: () => number;
}
