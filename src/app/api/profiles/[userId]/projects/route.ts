import { logger } from '@/utils/logger';
import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { userId } = await params;

    // Get user's projects (simplified MVP - no organizations)
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(
        `
        id,
        title,
        description,
        category,
        tags,
        status,
        bitcoin_address,
        lightning_address,
        goal_amount,
        currency,
        raised_amount,
        bitcoin_balance_btc,
        bitcoin_balance_updated_at,
        created_at,
        updated_at
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (projectsError) {
      throw projectsError;
    }

    return NextResponse.json(
      {
        success: true,
        data: projects || [],
        counts: {
          total: projects?.length || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error fetching user projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
