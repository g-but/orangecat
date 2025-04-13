import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const supabaseAuth = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabaseAuth.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, description, goal_amount_btc, bitcoin_address, lightning_address } = await request.json();

    // Input validation
    if (!title || !description || !goal_amount_btc || !bitcoin_address) {
      return NextResponse.json(
        { error: 'Title, description, goal amount (BTC), and Bitcoin address are required' },
        { status: 400 }
      );
    }

    // Create funding page
    const { data: fundingPage, error: fundingError } = await supabase
      .from('funding_pages')
      .insert([
        {
          user_id: session.user.id,
          title,
          description,
          goal_amount_btc,
          current_amount_btc: 0,
          status: 'active',
          bitcoin_address,
          lightning_address,
        },
      ])
      .select()
      .single();

    if (fundingError) {
      return NextResponse.json(
        { error: fundingError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Funding page created successfully',
      fundingPage,
    });
  } catch (error) {
    console.error('Error creating funding page:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the funding page' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let query = supabase
      .from('funding_pages')
      .select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: fundingPages, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      fundingPages,
    });
  } catch (error) {
    console.error('Error fetching funding pages:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching funding pages' },
      { status: 500 }
    );
  }
} 