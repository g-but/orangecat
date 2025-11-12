/**
 * Shared Validation Schemas
 *
 * Eliminates DRY violations by centralizing validation logic.
 * Used by both client-side forms and server-side API validation.
 *
 * ♻️ REFACTORED: Eliminates ~45 lines of duplicated validation logic
 */

import {
  isValidBitcoinAddress,
  isValidLightningAddress,
  isValidUsername,
  isValidBio,
  isValidEmail,
  isValidPassword,
} from '@/utils/validation';

// Base validation result interface
export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, string>;
}

// User profile validation schema
export interface ProfileUpdateData {
  username?: string;
  name?: string;
  bio?: string;
  bitcoinAddress?: string;
  lightningAddress?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  website?: string;
  location?: string;
}

export function validateProfileUpdate(data: ProfileUpdateData): ValidationResult {
  const errors: Record<string, string> = {};

  // Username validation
  if (data.username !== undefined) {
    if (!data.username.trim()) {
      errors.username = 'Username is required';
    } else if (!isValidUsername(data.username)) {
      errors.username = 'Username must be 3-30 characters, alphanumeric and underscore only';
    }
  }

  // Name validation
  if (data.name !== undefined) {
    if (!data.name.trim()) {
      errors.name = 'Name is required';
    } else if (data.name.length > 100) {
      errors.name = 'Name must be 100 characters or less';
    }
  }

  // Bio validation
  if (data.bio !== undefined && data.bio.trim()) {
    if (!isValidBio(data.bio)) {
      errors.bio = 'Bio must be 500 characters or less';
    }
  }

  // Bitcoin address validation
  if (data.bitcoinAddress !== undefined && data.bitcoinAddress.trim()) {
    if (!isValidBitcoinAddress(data.bitcoinAddress)) {
      errors.bitcoinAddress = 'Invalid Bitcoin address format';
    }
  }

  // Lightning address validation
  if (data.lightningAddress !== undefined && data.lightningAddress.trim()) {
    if (!isValidLightningAddress(data.lightningAddress)) {
      errors.lightningAddress = 'Invalid Lightning address format';
    }
  }

  // Website URL validation
  if (data.website !== undefined && data.website.trim()) {
    try {
      new URL(data.website);
    } catch {
      errors.website = 'Invalid website URL format';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    error: Object.keys(errors).length > 0 ? 'Validation failed' : undefined,
    details: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

// Campaign creation validation schema
export interface CampaignCreateData {
  title: string;
  description: string;
  goal?: string;
  category?: string;
  tags?: string[];
  bitcoinAddress?: string;
  lightningAddress?: string;
  endDate?: string;
  imageUrl?: string;
}

export function validateCampaignCreate(data: CampaignCreateData): ValidationResult {
  const errors: Record<string, string> = {};

  // Title validation
  if (!data.title || !data.title.trim()) {
    errors.title = 'Project title is required';
  } else if (data.title.length < 5) {
    errors.title = 'Title must be at least 5 characters';
  } else if (data.title.length > 100) {
    errors.title = 'Title must be 100 characters or less';
  }

  // Description validation
  if (!data.description || !data.description.trim()) {
    errors.description = 'Campaign description is required';
  } else if (data.description.length < 20) {
    errors.description = 'Description must be at least 20 characters';
  } else if (data.description.length > 2000) {
    errors.description = 'Description must be 2000 characters or less';
  }

  // Goal validation (if provided)
  if (data.goal !== undefined && data.goal.trim()) {
    const goalNum = parseFloat(data.goal);
    if (isNaN(goalNum) || goalNum <= 0) {
      errors.goal = 'Goal must be a positive number';
    } else if (goalNum > 21000000) {
      errors.goal = 'Goal cannot exceed 21 million BTC';
    }
  }

  // Bitcoin address validation (if provided)
  if (data.bitcoinAddress !== undefined && data.bitcoinAddress.trim()) {
    if (!isValidBitcoinAddress(data.bitcoinAddress)) {
      errors.bitcoinAddress = 'Invalid Bitcoin address format';
    }
  }

  // Lightning address validation (if provided)
  if (data.lightningAddress !== undefined && data.lightningAddress.trim()) {
    if (!isValidLightningAddress(data.lightningAddress)) {
      errors.lightningAddress = 'Invalid Lightning address format';
    }
  }

  // End date validation (if provided)
  if (data.endDate !== undefined && data.endDate.trim()) {
    const endDate = new Date(data.endDate);
    const now = new Date();
    if (isNaN(endDate.getTime())) {
      errors.endDate = 'Invalid end date format';
    } else if (endDate <= now) {
      errors.endDate = 'End date must be in the future';
    }
  }

  // Tags validation (if provided)
  if (data.tags !== undefined) {
    if (data.tags.length > 10) {
      errors.tags = 'Maximum 10 tags allowed';
    }
    for (const tag of data.tags) {
      if (tag.length > 20) {
        errors.tags = 'Each tag must be 20 characters or less';
        break;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    error: Object.keys(errors).length > 0 ? 'Validation failed' : undefined,
    details: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

// User registration validation schema
export interface UserRegistrationData {
  email: string;
  password: string;
  confirmPassword?: string;
  username?: string;
  agreeToTerms?: boolean;
}

export function validateUserRegistration(data: UserRegistrationData): ValidationResult {
  const errors: Record<string, string> = {};

  // Email validation
  if (!data.email || !data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Invalid email format';
  }

  // Password validation
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (!isValidPassword(data.password)) {
    errors.password =
      'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
  }

  // Confirm password validation (if provided)
  if (data.confirmPassword !== undefined) {
    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
  }

  // Username validation (if provided)
  if (data.username !== undefined && data.username.trim()) {
    if (!isValidUsername(data.username)) {
      errors.username = 'Username must be 3-30 characters, alphanumeric and underscore only';
    }
  }

  // Terms agreement validation (if provided)
  if (data.agreeToTerms !== undefined && !data.agreeToTerms) {
    errors.terms = 'You must agree to the terms and conditions';
  }

  return {
    valid: Object.keys(errors).length === 0,
    error: Object.keys(errors).length > 0 ? 'Validation failed' : undefined,
    details: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

// File upload validation schema
export interface FileUploadData {
  file: File;
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export function validateFileUpload(data: FileUploadData): ValidationResult {
  const errors: Record<string, string> = {};

  // File existence check
  if (!data.file) {
    errors.file = 'File is required';
    return {
      valid: false,
      error: 'File validation failed',
      details: errors,
    };
  }

  // File size validation
  const maxSize = data.maxSize || 5 * 1024 * 1024; // Default 5MB
  if (data.file.size > maxSize) {
    errors.size = `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
  }

  // File type validation
  if (data.allowedTypes && data.allowedTypes.length > 0) {
    if (!data.allowedTypes.includes(data.file.type)) {
      errors.type = `File type must be one of: ${data.allowedTypes.join(', ')}`;
    }
  }

  // File extension validation
  if (data.allowedExtensions && data.allowedExtensions.length > 0) {
    const extension = data.file.name.split('.').pop()?.toLowerCase();
    if (!extension || !data.allowedExtensions.includes(extension)) {
      errors.extension = `File extension must be one of: ${data.allowedExtensions.join(', ')}`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    error: Object.keys(errors).length > 0 ? 'File validation failed' : undefined,
    details: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

// Generic field validation helpers
export const ValidationHelpers = {
  required: (value: any, fieldName: string) => {
    if (value === null || value === undefined || String(value).trim() === '') {
      return `${fieldName} is required`;
    }
    return null;
  },

  minLength: (value: string, min: number, fieldName: string) => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value: string, max: number, fieldName: string) => {
    if (value && value.length > max) {
      return `${fieldName} must be ${max} characters or less`;
    }
    return null;
  },

  email: (value: string) => {
    if (value && !isValidEmail(value)) {
      return 'Invalid email format';
    }
    return null;
  },

  url: (value: string) => {
    if (value) {
      try {
        new URL(value);
      } catch {
        return 'Invalid URL format';
      }
    }
    return null;
  },
};
