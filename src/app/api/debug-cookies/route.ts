import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';;
import { cookies } from 'next/headers';

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    logger.info('=== COOKIE DEBUG ===');
    logger.info(
      'All cookies:',
      allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 50) + '...' }))
    );

    // Look for Supabase cookies specifically
    const supabaseCookies = allCookies.filter(
      cookie => cookie.name.includes('supabase') || cookie.name.includes('sb-')
    );

    logger.info(
      'Supabase cookies:',
      supabaseCookies.map(c => ({ name: c.name, hasValue: !!c.value }))
    );

    return NextResponse.json({
      totalCookies: allCookies.length,
      supabaseCookies: supabaseCookies.map(c => c.name),
      cookieNames: allCookies.map(c => c.name),
    });
  } catch (error) {
    logger.error('Cookie debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}



