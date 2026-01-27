import { NextRequest, NextResponse } from 'next/server';
import { verifyCaptchaToken } from '@/lib/captcha';
import { logger } from '@/utils/logger';

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
      return NextResponse.json(
        { success: false, error: 'CAPTCHA token is required' },
        { status: 400 }
      );
    }

    // Get client IP for additional validation
    const forwardedFor = request.headers.get('x-forwarded-for');
    const remoteIp = forwardedFor?.split(',')[0]?.trim();

    const result = await verifyCaptchaToken(token, remoteIp);

    if (result.success) {
      return NextResponse.json({
        success: true,
        timestamp: result.timestamp,
      });
    }

    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  } catch (error) {
    logger.error('CAPTCHA verification error', error, 'CaptchaAPI');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
