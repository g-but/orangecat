/**
 * API Validation Utilities
 *
 * Centralized validation helpers for API routes to eliminate duplicate validation logic.
 * Used by all API endpoints to ensure consistent validation and error responses.
 *
 * Week 3 Improvement: Consolidates ~80 lines of duplicated validation across API routes
 */

import { NextResponse } from 'next/server';
import { isValidUUID, isValidBitcoinAddress } from '@/utils/validation';
import { apiBadRequest, apiUnauthorized } from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { getTableName } from '@/config/entity-registry';
import type { User } from '@supabase/supabase-js';

/**
 * Validation result type for API validators
 */
export interface ApiValidationResult {
  valid: boolean;
  error?: NextResponse;
}

/**
 * Validate that user is authenticated
 * @param user - User object from Supabase auth
 * @returns Validation result with unauthorized error if user is null
 */
export function validateAuth(user: User | null): ApiValidationResult {
  if (!user) {
    return {
      valid: false,
      error: apiUnauthorized(),
    };
  }

  return { valid: true };
}

/**
 * Validate UUID format for IDs
 * @param id - ID to validate
 * @param paramName - Name of the parameter (for error message)
 * @returns Validation result with bad request error if invalid
 */
export function validateUUID(
  id: string | null | undefined,
  paramName: string = 'ID'
): ApiValidationResult {
  if (!id) {
    return {
      valid: false,
      error: apiBadRequest(`${paramName} is required`),
    };
  }

  if (!isValidUUID(id)) {
    return {
      valid: false,
      error: apiBadRequest(`Invalid ${paramName} format`),
    };
  }

  return { valid: true };
}

/**
 * Validate that one of multiple IDs is provided (e.g., profile_id OR project_id)
 * @param ids - Object with ID keys and values
 * @param errorMessage - Custom error message
 * @returns Validation result with the valid ID or error
 */
export function validateOneOfIds(
  ids: Record<string, string | null | undefined>,
  errorMessage?: string
): ApiValidationResult & { id?: string; type?: string } {
  const entries = Object.entries(ids).filter(([_, value]) => value);

  if (entries.length === 0) {
    return {
      valid: false,
      error: apiBadRequest(errorMessage || `One of ${Object.keys(ids).join(', ')} is required`),
    };
  }

  if (entries.length > 1) {
    return {
      valid: false,
      error: apiBadRequest(`Only one of ${Object.keys(ids).join(', ')} can be specified`),
    };
  }

  const [type, id] = entries[0];

  // Validate UUID format
  const uuidResult = validateUUID(id, type);
  if (!uuidResult.valid) {
    return uuidResult;
  }

  return {
    valid: true,
    id: id!,
    type,
  };
}

/**
 * Validate required string parameter
 * @param value - Value to validate
 * @param paramName - Name of the parameter (for error message)
 * @param minLength - Optional minimum length
 * @param maxLength - Optional maximum length
 * @returns Validation result with bad request error if invalid
 */
export function validateRequiredString(
  value: string | null | undefined,
  paramName: string,
  options?: { minLength?: number; maxLength?: number }
): ApiValidationResult {
  if (!value || !value.trim()) {
    return {
      valid: false,
      error: apiBadRequest(`${paramName} is required`),
    };
  }

  const trimmed = value.trim();

  if (options?.minLength && trimmed.length < options.minLength) {
    return {
      valid: false,
      error: apiBadRequest(`${paramName} must be at least ${options.minLength} characters`),
    };
  }

  if (options?.maxLength && trimmed.length > options.maxLength) {
    return {
      valid: false,
      error: apiBadRequest(`${paramName} must be ${options.maxLength} characters or less`),
    };
  }

  return { valid: true };
}

/**
 * Validate Bitcoin address or xpub
 * @param address - Bitcoin address or xpub to validate
 * @param paramName - Name of the parameter (for error message)
 * @param required - Whether the address is required
 * @returns Validation result with bad request error if invalid
 */
export function validateBitcoinAddressParam(
  address: string | null | undefined,
  paramName: string = 'Bitcoin address',
  required: boolean = true
): ApiValidationResult {
  if (!address || !address.trim()) {
    if (required) {
      return {
        valid: false,
        error: apiBadRequest(`${paramName} is required`),
      };
    }
    return { valid: true };
  }

  const trimmed = address.trim();

  // Check for xpub/ypub/zpub
  const isXpub = /^(xpub|ypub|zpub|tpub)[a-zA-Z0-9]{100,}$/.test(trimmed);

  if (!isXpub && !isValidBitcoinAddress(trimmed)) {
    return {
      valid: false,
      error: apiBadRequest(`Invalid ${paramName} format`),
    };
  }

  return { valid: true };
}

/**
 * Validate entity ownership (user owns profile/project)
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param entityType - 'profile' or 'project'
 * @param entityId - Entity ID to check ownership
 * @returns Boolean indicating ownership
 */
export async function validateEntityOwnership(
  supabase: any,
  userId: string,
  entityType: 'profile' | 'project',
  entityId: string
): Promise<boolean> {
  if (entityType === 'profile') {
    // For profiles, check if profile.id matches userId
    const { data, error } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .select('id')
      .eq('id', entityId)
      .eq('id', userId)
      .single();

    return !error && data !== null;
  } else {
    // For projects, check if project.creator_id matches userId
    const { data, error } = await supabase
      .from(getTableName('project'))
      .select('creator_id')
      .eq('id', entityId)
      .single();

    return !error && data?.creator_id === userId;
  }
}

/**
 * Validate pagination parameters
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Validated page and limit with defaults applied
 */
export function validatePagination(
  page: string | null | undefined,
  limit: string | null | undefined
): { page: number; limit: number; offset: number; error?: NextResponse } {
  const defaultPage = 1;
  const defaultLimit = 20;
  const maxLimit = 100;

  const parsedPage = page ? parseInt(page, 10) : defaultPage;
  const parsedLimit = limit ? parseInt(limit, 10) : defaultLimit;

  if (isNaN(parsedPage) || parsedPage < 1) {
    return {
      page: defaultPage,
      limit: defaultLimit,
      offset: 0,
      error: apiBadRequest('Invalid page number'),
    };
  }

  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > maxLimit) {
    return {
      page: defaultPage,
      limit: defaultLimit,
      offset: 0,
      error: apiBadRequest(`Invalid limit (must be 1-${maxLimit})`),
    };
  }

  const offset = (parsedPage - 1) * parsedLimit;

  return {
    page: parsedPage,
    limit: parsedLimit,
    offset,
  };
}

/**
 * Validate enum value
 * @param value - Value to validate
 * @param allowedValues - Array of allowed values
 * @param paramName - Name of the parameter (for error message)
 * @param required - Whether the value is required
 * @returns Validation result with bad request error if invalid
 */
export function validateEnum<T extends string>(
  value: string | null | undefined,
  allowedValues: readonly T[],
  paramName: string,
  required: boolean = true
): ApiValidationResult & { value?: T } {
  if (!value || !value.trim()) {
    if (required) {
      return {
        valid: false,
        error: apiBadRequest(`${paramName} is required`),
      };
    }
    return { valid: true };
  }

  const trimmed = value.trim() as T;

  if (!allowedValues.includes(trimmed)) {
    return {
      valid: false,
      error: apiBadRequest(`${paramName} must be one of: ${allowedValues.join(', ')}`),
    };
  }

  return {
    valid: true,
    value: trimmed,
  };
}

/**
 * Validate positive number
 * @param value - Value to validate
 * @param paramName - Name of the parameter (for error message)
 * @param options - Min/max constraints
 * @returns Validation result with bad request error if invalid
 */
export function validatePositiveNumber(
  value: number | string | null | undefined,
  paramName: string,
  options?: { min?: number; max?: number; integer?: boolean }
): ApiValidationResult & { value?: number } {
  if (value === null || value === undefined) {
    return {
      valid: false,
      error: apiBadRequest(`${paramName} is required`),
    };
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return {
      valid: false,
      error: apiBadRequest(`${paramName} must be a valid number`),
    };
  }

  if (num <= 0) {
    return {
      valid: false,
      error: apiBadRequest(`${paramName} must be positive`),
    };
  }

  if (options?.integer && !Number.isInteger(num)) {
    return {
      valid: false,
      error: apiBadRequest(`${paramName} must be an integer`),
    };
  }

  if (options?.min !== undefined && num < options.min) {
    return {
      valid: false,
      error: apiBadRequest(`${paramName} must be at least ${options.min}`),
    };
  }

  if (options?.max !== undefined && num > options.max) {
    return {
      valid: false,
      error: apiBadRequest(`${paramName} must be at most ${options.max}`),
    };
  }

  return {
    valid: true,
    value: num,
  };
}

/**
 * Helper to check validation result and return error if invalid
 * @param result - Validation result
 * @returns Error response or null
 *
 * @example
 * const authValidation = validateAuth(user);
 * const authError = getValidationError(authValidation);
 * if (authError) return authError;
 */
export function getValidationError(result: ApiValidationResult): NextResponse | null {
  return result.valid ? null : (result.error ?? null);
}

/**
 * Helper to validate multiple conditions and return first error
 * @param validations - Array of validation results
 * @returns First error found or null
 *
 * @example
 * const error = getFirstValidationError([
 *   validateAuth(user),
 *   validateUUID(profile_id, 'profile_id'),
 *   validateRequiredString(name, 'name'),
 * ]);
 * if (error) return error;
 */
export function getFirstValidationError(validations: ApiValidationResult[]): NextResponse | null {
  for (const validation of validations) {
    const error = getValidationError(validation);
    if (error) {
      return error;
    }
  }
  return null;
}
