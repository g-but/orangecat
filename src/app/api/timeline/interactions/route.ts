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
    const { action, eventId, content, parentCommentId } = body;

    if (!action || !eventId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'like':
        result = await timelineService.toggleLike(eventId, user.id);
        break;

      case 'share':
        result = await timelineService.shareEvent(eventId, body.shareText, body.visibility);
        break;

      case 'comment':
        if (!content?.trim()) {
          return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
        }
        result = await timelineService.addComment(eventId, content.trim(), parentCommentId);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: result.error || 'Action failed' }, { status: 400 });
    }
  } catch (error) {
    console.error('Timeline interaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const eventId = searchParams.get('eventId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!action || !eventId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'comments':
        result = await timelineService.getEventComments(eventId, limit, offset);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Timeline get interaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
