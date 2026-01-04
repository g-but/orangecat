/**
 * Project Wizard Constants
 *
 * Constants and configuration for the ProjectWizard component.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from ProjectWizard.tsx
 */

import { categoryValues } from '@/config/categories';
import type { ProjectFormData } from './types';

/**
 * Available categories for project selection
 * Uses SSOT from config/categories
 */
export const AVAILABLE_CATEGORIES = categoryValues;

/**
 * Calculate form completion percentage
 */
export const getCompletionPercentage = (formData: ProjectFormData): number => {
  const fields = [
    { value: formData.title.trim(), weight: 30 },
    { value: formData.description.trim(), weight: 40 },
    { value: formData.goalAmount.trim(), weight: 10 },
    { value: formData.bitcoinAddress.trim(), weight: 15 },
    { value: formData.selectedCategories.length > 0, weight: 5 },
  ];
  const completedWeight = fields.reduce((sum, field) => sum + (field.value ? field.weight : 0), 0);
  return Math.min(completedWeight, 100);
};


