import { NextRequest, NextResponse } from 'next/server';
import { fetchConversationSummary } from '@/features/messaging/service.server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const conversation = await fetchConversationSummary(conversationId)
    return NextResponse.json({ conversation })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
