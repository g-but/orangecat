import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG AUTH GET ===');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));

    const supabase = await createServerClient();
    console.log('Supabase client created');

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('User:', user);
    console.log('Auth error:', authError);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session:', session);
    console.log('Session error:', sessionError);

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email } : null,
      authError: authError?.message,
      sessionError: sessionError?.message,
      hasSession: !!session,
      hasUser: !!user
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG AUTH POST ===');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));

    const supabase = await createServerClient();
    console.log('Supabase client created');

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('User:', user);
    console.log('Auth error:', authError);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session:', session);
    console.log('Session error:', sessionError);

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email } : null,
      authError: authError?.message,
      sessionError: sessionError?.message,
      hasSession: !!session,
      hasUser: !!user
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}








