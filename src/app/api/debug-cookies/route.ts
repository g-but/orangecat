import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    console.log('=== COOKIE DEBUG ===');
    console.log('All cookies:', allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 50) + '...' })));

    // Look for Supabase cookies specifically
    const supabaseCookies = allCookies.filter(cookie =>
      cookie.name.includes('supabase') ||
      cookie.name.includes('sb-')
    );

    console.log('Supabase cookies:', supabaseCookies.map(c => ({ name: c.name, hasValue: !!c.value })));

    return NextResponse.json({
      totalCookies: allCookies.length,
      supabaseCookies: supabaseCookies.map(c => c.name),
      cookieNames: allCookies.map(c => c.name)
    });
  } catch (error) {
    console.error('Cookie debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}


























