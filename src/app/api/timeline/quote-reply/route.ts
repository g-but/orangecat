import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { timelineService } from '@/services/timeline';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { parentPostId, content, quotedContent, visibility = 'public' } = body;

    if (!parentPostId || !content?.trim()) {
      return NextResponse.json({
        error: 'Missing required fields: parentPostId and content are required'
      }, { status: 400 });
    }

    // Create quote reply using the service
    const result = await timelineService.createQuoteReply(
      parentPostId,
      user.id,
      content.trim(),
      quotedContent?.trim() || '',
      visibility
    );

    if (result.success && result.event) {
      // Fetch the enriched event for the response
      const enrichedResult = await timelineService.getEventById(result.event.id);

      if (enrichedResult.success && enrichedResult.event) {
        return NextResponse.json({
          success: true,
          event: enrichedResult.event
        });
      }
    }

    return NextResponse.json({
      error: result.error || 'Failed to create quote reply'
    }, { status: 400 });

  } catch (error) {
    console.error('Quote reply creation error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

















