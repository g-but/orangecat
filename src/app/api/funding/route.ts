import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { fundingPageId, amount, currency, paymentMethod } = await request.json();
    const supabase = createServerSupabaseClient();

    // Input validation
    if (!fundingPageId || !amount || !currency || !paymentMethod) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Create transaction record
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        funding_page_id: fundingPageId,
        amount,
        currency,
        payment_method: paymentMethod,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Transaction created successfully',
      transaction: data,
    });
  } catch (error) {
    console.error('Transaction creation error:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the transaction' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const supabase = createServerSupabaseClient();

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