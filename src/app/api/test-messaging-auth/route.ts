import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    console.log('=== TEST MESSAGING AUTH ===');
    console.log('All cookies:', allCookies.map(c => c.name));
    
    // Try to create server client
    const supabase = await createServerClient();
    
    // Try session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session:', { hasSession: !!session, error: sessionError?.message });
    
    // Try user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User:', { userId: user?.id, error: userError?.message });
    
    // Check request headers
    const cookieHeader = request.headers.get('cookie');
    console.log('Cookie header present:', !!cookieHeader);
    if (cookieHeader) {
      console.log('Cookie header length:', cookieHeader.length);
    }
    
    return NextResponse.json({
      cookies: allCookies.map(c => c.name),
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id,
      sessionError: sessionError?.message,
      userError: userError?.message,
      cookieHeaderPresent: !!cookieHeader
    });
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}







