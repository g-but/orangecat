/**
 * Wallet Error Handling Utilities
 *
 * Standardized error handling for wallet operations.
 *
 * Created: 2025-11-29
 */

import { NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import { apiError, type ApiErrorResponse } from '@/lib/api/standardResponse';

/**
 * Parse error from API response
 */
export async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const errorData = await response.json();
    // Handle standardized shape: { success: false, error: { message } }
    if (errorData && errorData.success === false && errorData.error) {
      const msg = typeof errorData.error === 'string' ? errorData.error : errorData.error.message;
      return msg || response.statusText || 'Unknown error';
    }
    // Legacy shape: { error: string }
    if (typeof errorData?.error === 'string') {
      return errorData.error;
    }
    return response.statusText || 'Unknown error';
  } catch {
    return response.statusText || 'Unknown error';
  }
}

/**
 * Create standardized error response
 */
export function createWalletErrorResponse(
  error: string,
  code: string,
  status: number = 500,
  details?: any
): NextResponse<ApiErrorResponse> {
  // Use standardized API error shape
  return apiError(error, code, status, details);
}

/**
 * Log wallet operation error
 */
export function logWalletError(
  operation: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorData = {
    operation,
    error: errorMessage,
    ...(error instanceof Error && { stack: error.stack }),
    ...context,
  };

  logger.error(`Wallet ${operation} failed`, errorData, 'WalletManagement');
}

/**
 * Check if error is a table not found error
 */
export function isTableNotFoundError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code?: string }).code === '42P01';
  }
  return false;
}

/**
 * Handle Supabase errors with proper logging
 */
export function handleSupabaseError(
  operation: string,
  error: unknown,
  context?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  logWalletError(operation, error, context);

  if (isTableNotFoundError(error)) {
    // Table doesn't exist - this is expected during migrations
    return createWalletErrorResponse('Wallets table not available', 'TABLE_NOT_FOUND', 503);
  }

  const errorMessage = error instanceof Error ? error.message : 'Database operation failed';

  return createWalletErrorResponse(errorMessage, 'DATABASE_ERROR', 500);
}
