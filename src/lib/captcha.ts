/**
 * CAPTCHA Verification Utilities
 *
 * Server-side verification for Cloudflare Turnstile CAPTCHA tokens.
 */

import { logger } from '@/utils/logger';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

export interface VerifyCaptchaResult {
  success: boolean;
  error?: string;
  timestamp?: string;
  hostname?: string;
}

/**
 * Verify a Turnstile CAPTCHA token server-side
 *
 * @param token - The token returned from the Turnstile widget
 * @param remoteIp - Optional client IP address for additional validation
 * @returns Verification result
 */
export async function verifyCaptchaToken(
  token: string,
  remoteIp?: string
): Promise<VerifyCaptchaResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    // In development without secret key, allow bypass
    if (process.env.NODE_ENV === 'development') {
      logger.warn('No TURNSTILE_SECRET_KEY - bypassing verification in development', 'CAPTCHA');
      return { success: true };
    }
    return {
      success: false,
      error: 'CAPTCHA verification not configured',
    };
  }

  if (!token) {
    return {
      success: false,
      error: 'CAPTCHA token is required',
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to verify CAPTCHA',
      };
    }

    const result: TurnstileVerifyResponse = await response.json();

    if (result.success) {
      return {
        success: true,
        timestamp: result.challenge_ts,
        hostname: result.hostname,
      };
    }

    // Map error codes to user-friendly messages
    const errorCode = result['error-codes']?.[0];
    const errorMessage = mapTurnstileError(errorCode);

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    logger.error('Verification error', error, 'CAPTCHA');
    return {
      success: false,
      error: 'CAPTCHA verification failed',
    };
  }
}

/**
 * Map Turnstile error codes to user-friendly messages
 */
function mapTurnstileError(errorCode?: string): string {
  const errorMap: Record<string, string> = {
    'missing-input-secret': 'Server configuration error',
    'invalid-input-secret': 'Server configuration error',
    'missing-input-response': 'Please complete the CAPTCHA',
    'invalid-input-response': 'Invalid CAPTCHA. Please try again.',
    'bad-request': 'Invalid request. Please refresh and try again.',
    'timeout-or-duplicate': 'CAPTCHA expired. Please try again.',
    'internal-error': 'Server error. Please try again later.',
  };

  return errorMap[errorCode || ''] || 'CAPTCHA verification failed. Please try again.';
}

/**
 * Check if CAPTCHA is enabled
 */
export function isCaptchaEnabled(): boolean {
  // CAPTCHA is enabled if we have a site key (client-side check)
  // or secret key (server-side check)
  return !!(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.TURNSTILE_SECRET_KEY);
}

/**
 * Get the site key for client-side usage
 */
export function getCaptchaSiteKey(): string | undefined {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}
