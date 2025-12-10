/**
 * RUNTIME ENVIRONMENT VALIDATION
 *
 * Validates required environment variables at startup
 * Prevents deployment with missing/invalid configuration
 * Part of Priority 0: Foundation improvements
 *
 * Created: 2025-10-23
 */

import { logger } from '@/utils/logger';

// =====================================================================
// REQUIRED ENVIRONMENT VARIABLES
// =====================================================================

const REQUIRED_ENV_VARS = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key',

  // Optional but recommended
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key (for admin operations)',
} as const;

const OPTIONAL_ENV_VARS = {
  // Analytics
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: 'Vercel Analytics ID',

  // Feature flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: 'Enable analytics',

  // URLs
  NEXT_PUBLIC_APP_URL: 'Application URL',

  // AI/LLM
  GEMINI_API_KEY: 'Google Gemini API key for LLM chat functionality',
} as const;

// =====================================================================
// VALIDATION FUNCTIONS
// =====================================================================

interface ValidationResult {
  valid: boolean;
  missing: string[];
  invalid: string[];
  warnings: string[];
}

/**
 * Validate a URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate Supabase URL format
 */
function isValidSupabaseUrl(url: string): boolean {
  if (!isValidUrl(url)) {
    return false;
  }
  return url.includes('.supabase.co') || url.includes('localhost');
}

/**
 * Validate Supabase key format
 */
function isValidSupabaseKey(key: string): boolean {
  // Keys should be JWT-like strings with at least 32 chars
  return key.length > 32 && key.split('.').length === 3;
}

/**
 * Validate all required environment variables
 */
export function validateEnvironment(): ValidationResult {
  const missing: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  for (const [key, description] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key];

    if (!value) {
      missing.push(`${key} (${description})`);
      continue;
    }

    // Validate specific formats
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
      if (!isValidSupabaseUrl(value)) {
        invalid.push(`${key}: Invalid Supabase URL format`);
      }
    }

    if (key.includes('KEY') || key.includes('ANON')) {
      if (!isValidSupabaseKey(value)) {
        invalid.push(`${key}: Invalid key format`);
      }
    }
  }

  // Check optional vars and add warnings
  for (const [key, description] of Object.entries(OPTIONAL_ENV_VARS)) {
    const value = process.env[key];

    if (!value) {
      warnings.push(`${key} (${description}) not set`);
    }
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    warnings,
  };
}

/**
 * Assert environment is valid, throw if not
 */
export function assertValidEnvironment(): void {
  const result = validateEnvironment();

  if (!result.valid) {
    const errorMessages: string[] = [];

    if (result.missing.length > 0) {
      errorMessages.push('Missing required environment variables:');
      result.missing.forEach(msg => errorMessages.push(`  - ${msg}`));
    }

    if (result.invalid.length > 0) {
      errorMessages.push('Invalid environment variables:');
      result.invalid.forEach(msg => errorMessages.push(`  - ${msg}`));
    }

    const error = new Error(errorMessages.join('\n'));
    error.name = 'EnvironmentValidationError';
    throw error;
  }

  // Log warnings
  if (result.warnings.length > 0 && process.env.NODE_ENV === 'development') {
    logger.warn('Environment warnings:', result.warnings);
  }
}

/**
 * Get safe environment info (without exposing secrets)
 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0] + '.supabase.co',
  };
}

// =====================================================================
// AUTO-VALIDATION ON IMPORT (Development only)
// =====================================================================

if (process.env.NODE_ENV === 'development') {
  try {
    assertValidEnvironment();
    logger.info('Environment validation passed', getEnvironmentInfo());
  } catch (error) {
    logger.error('Environment validation failed:', error);
    // Don't throw in development, just log
  }
}

// Export for manual validation
export default {
  validate: validateEnvironment,
  assert: assertValidEnvironment,
  info: getEnvironmentInfo,
};
