import { NextRequest } from 'next/server';
import { verifyCaptchaToken } from '@/lib/captcha';
import { logger } from '@/utils/logger';
import { apiSuccess, apiBadRequest, apiInternalError } from '@/lib/api/standardResponse';

/**
 * POST /api/auth/verify-captcha
 *
 * Verify a Cloudflare Turnstile CAPTCHA token.
 * Used to validate CAPTCHA before registration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return apiBadRequest('CAPTCHA token is required');
    }

    // Get client IP for additional validation
    const forwardedFor = request.headers.get('x-forwarded-for');
    const remoteIp = forwardedFor?.split(',')[0]?.trim();

    const result = await verifyCaptchaToken(token, remoteIp);

    if (result.success) {
      return apiSuccess({ timestamp: result.timestamp });
    }

    return apiBadRequest(result.error || 'CAPTCHA verification failed');
  } catch (error) {
    logger.error('CAPTCHA verification error', error, 'CaptchaAPI');
    return apiInternalError('Internal server error');
  }
}
