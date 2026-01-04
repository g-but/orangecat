/**
 * Project Wizard Types
 *
 * Type definitions for the ProjectWizard component.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from ProjectWizard.tsx
 */

import type { ProjectFieldType } from '@/lib/project-guidance';

export interface ProjectFormData {
  title: string;
  description: string;
  goalAmount: string;
  goalCurrency: 'CHF' | 'USD' | 'EUR' | 'BTC' | 'SATS';
  fundingPurpose: string;
  bitcoinAddress: string;
  websiteUrl: string;
  selectedCategories: string[];
}

export interface FormErrors {
  title?: string;
  description?: string;
  goalAmount?: string;
  bitcoinAddress?: string;
  websiteUrl?: string;
}

export interface ProjectWizardProps {
  projectId?: string;
  initialData?: Partial<ProjectFormData>;
  onSave?: () => void;
  onCancel?: () => void;
  onFieldFocus?: (field: ProjectFieldType) => void;
  onProgressChange?: (percentage: number) => void;
  onGoalAmountChange?: (amount: number | undefined) => void;
  onGoalCurrencyChange?: (currency: 'CHF' | 'USD' | 'EUR' | 'BTC' | 'SATS') => void;
}

export type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface StatusAction {
  label: string;
  status: ProjectStatus;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'danger';
}


