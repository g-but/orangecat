/**
 * Auth Error Handling
 */

import type { AuthError } from '../types';

/**
 * Enhanced error handling with timeout detection for authentication operations
 */
export const handleAuthError = (error: unknown, _operation: string): AuthError => {
  const err = error as { name?: string; message?: string };

  if (err.name === 'AbortError' || err.message?.includes('timeout')) {
    return {
      name: 'TimeoutError',
      message: 'Request timed out. Please check your internet connection or try again later.',
      status: 408,
    } as AuthError;
  }

  if (err.message?.includes('fetch')) {
    return {
      name: 'NetworkError',
      message:
        'Unable to connect to authentication service. Please check your internet connection.',
      status: 0,
    } as AuthError;
  }

  return error as AuthError;
};
