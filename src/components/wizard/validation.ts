/**
 * Project Wizard Validation
 *
 * Validation logic for project form fields.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from ProjectWizard.tsx
 */

import type { FormErrors, ProjectFormData } from './types';

/**
 * Validate a single form field
 */
export const validateField = (field: string, value: string): string | undefined => {
  switch (field) {
    case 'title':
      if (!value.trim()) {
        return 'Title is required';
      }
      if (value.trim().length < 3) {
        return 'Title must be at least 3 characters';
      }
      if (value.trim().length > 100) {
        return 'Title must be less than 100 characters';
      }
      break;

    case 'description':
      if (!value.trim()) {
        return 'Description is required';
      }
      if (value.trim().length < 10) {
        return 'Description must be at least 10 characters';
      }
      if (value.trim().length > 2000) {
        return 'Description must be less than 2000 characters';
      }
      break;

    case 'goalAmount':
      if (value.trim()) {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) {
          return 'Please enter a valid positive number';
        }
      }
      break;

    case 'bitcoinAddress':
      if (value.trim()) {
        // Basic Bitcoin address validation
        const btcRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/;
        if (!btcRegex.test(value.trim())) {
          return 'Please enter a valid Bitcoin address';
        }
      }
      break;

    case 'websiteUrl':
      if (value.trim()) {
        try {
          // Try to parse as URL
          const url = new URL(value.trim().startsWith('http') ? value.trim() : `https://${value.trim()}`);
          if (!['http:', 'https:'].includes(url.protocol)) {
            return 'Please enter a valid URL (http:// or https://)';
          }
          if (!url.hostname || url.hostname.length < 3) {
            return 'Please enter a valid domain (e.g., example.com)';
          }
        } catch {
          return 'Please enter a valid website URL (e.g., example.com or https://example.com)';
        }
      }
      break;
  }
  return undefined;
};

/**
 * Validate entire form
 */
export const validateForm = (formData: ProjectFormData): { isValid: boolean; errors: FormErrors } => {
  const errors: FormErrors = {};
  let isValid = true;

  const titleError = validateField('title', formData.title);
  if (titleError) {
    errors.title = titleError;
    isValid = false;
  }

  const descError = validateField('description', formData.description);
  if (descError) {
    errors.description = descError;
    isValid = false;
  }

  const amountError = validateField('goalAmount', formData.goalAmount);
  if (amountError) {
    errors.goalAmount = amountError;
    isValid = false;
  }

  const addressError = validateField('bitcoinAddress', formData.bitcoinAddress);
  if (addressError) {
    errors.bitcoinAddress = addressError;
    isValid = false;
  }

  const websiteError = validateField('websiteUrl', formData.websiteUrl);
  if (websiteError) {
    errors.websiteUrl = websiteError;
    isValid = false;
  }

  return { isValid, errors };
};


