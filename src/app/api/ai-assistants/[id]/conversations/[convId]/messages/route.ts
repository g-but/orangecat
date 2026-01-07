/**
 * AI Conversation Messages API
 *
 * POST /api/ai-assistants/[id]/conversations/[convId]/messages - Send a message
 *
 * This endpoint:
 * 1. Checks user's credit balance
 * 2. Stores the user's message
 * 3. Generates AI response (mock for now, real AI integration later)
 * 4. Charges user for the interaction
 * 5. Records earnings for assistant creator
 * 6. Returns both messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { DATABASE_TABLES } from '@/config/database-tables';
import { createAIPaymentService } from '@/services/ai-payments';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string; convId: string }>;
}

const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
});

// Mock AI response generator (will be replaced with real AI in Phase 3)
async function generateAIResponse(
  systemPrompt: string | null,
  conversationHistory: Array<{ role: string; content: string }>,
  userMessage: string
): Promise<{ content: string; tokens_used: number }> {
  // For now, return a placeholder response
  // This will be replaced with actual AI API calls in Phase 3
  const responses = [
    "Thank you for your message! I'm here to help. This is a placeholder response - real AI integration coming soon.",
    "I understand your question. The AI integration is being set up, but I wanted to acknowledge your message.",
    "Great question! Once the AI backend is fully connected, I'll be able to provide more detailed responses.",
    "I appreciate you reaching out. The conversation system is working - AI responses will be enhanced soon.",
  ];

  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    content: responses[Math.floor(Math.random() * responses.length)],
    tokens_used: Math.floor(Math.random() * 100) + 50,
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: assistantId, convId } = await params;
    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = sendMessageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: result.error.flatten(),
      }, { status: 400 });
    }

    const { content } = result.data;

    // Verify conversation exists and belongs to user
    const { data: conversation, error: convError } = await supabase
      .from(DATABASE_TABLES.AI_CONVERSATIONS)
      .select('id, assistant_id, user_id, status')
      .eq('id', convId)
      .eq('assistant_id', assistantId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.status !== 'active') {
      return NextResponse.json({ error: 'Conversation is archived' }, { status: 400 });
    }

    // Get assistant details for system prompt and pricing
    const { data: assistant, error: assistantError } = await supabase
      .from('ai_assistants')
      .select('id, title, system_prompt, pricing_model, price_per_message, price_per_1k_tokens, user_id')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Initialize payment service and check balance
    const paymentService = createAIPaymentService(supabase);
    const balanceCheck = await paymentService.checkBalance(user.id, assistantId);

    if (!balanceCheck.hasBalance) {
      return NextResponse.json({
        error: 'Insufficient credits',
        details: {
          currentBalance: balanceCheck.currentBalance,
          requiredAmount: balanceCheck.requiredAmount,
          shortfall: balanceCheck.shortfall,
        },
      }, { status: 402 }); // 402 Payment Required
    }

    // Get conversation history for context
    const { data: history } = await supabase
      .from(DATABASE_TABLES.AI_MESSAGES)
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20); // Limit context window

    // Store user message
    const { data: userMessage, error: userMsgError } = await supabase
      .from(DATABASE_TABLES.AI_MESSAGES)
      .insert({
        conversation_id: convId,
        role: 'user',
        content,
        tokens_used: Math.ceil(content.length / 4), // Rough token estimate
        cost_sats: 0, // User messages are free
      })
      .select()
      .single();

    if (userMsgError) {
      console.error('Error storing user message:', userMsgError);
      return NextResponse.json({ error: 'Failed to store message' }, { status: 500 });
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(
      assistant.system_prompt,
      history || [],
      content
    );

    // Calculate cost based on pricing model
    let costSats = 0;
    if (assistant.pricing_model === 'per_message') {
      costSats = assistant.price_per_message || 0;
    } else if (assistant.pricing_model === 'per_token') {
      const price_per_1k = assistant.price_per_1k_tokens || 0;
      costSats = Math.ceil((aiResponse.tokens_used / 1000) * price_per_1k);
    }

    // Store AI response
    const { data: assistantMessage, error: aiMsgError } = await supabase
      .from(DATABASE_TABLES.AI_MESSAGES)
      .insert({
        conversation_id: convId,
        role: 'assistant',
        content: aiResponse.content,
        tokens_used: aiResponse.tokens_used,
        cost_sats: costSats,
        model_used: 'mock-v1', // Will be replaced with actual model
        metadata: {
          pricing_model: assistant.pricing_model,
        },
      })
      .select()
      .single();

    if (aiMsgError) {
      console.error('Error storing AI message:', aiMsgError);
      return NextResponse.json({ error: 'Failed to store AI response' }, { status: 500 });
    }

    // Charge user for the interaction (if cost > 0)
    let paymentResult = null;
    if (costSats > 0) {
      paymentResult = await paymentService.chargeForMessage({
        userId: user.id,
        assistantId,
        conversationId: convId,
        messageId: assistantMessage.id,
        tokenCount: aiResponse.tokens_used,
      });

      if (!paymentResult.success) {
        // Note: Message was already stored - we continue but log the payment issue
        // In production, you might want to handle this differently
        console.warn('Payment failed after message stored:', paymentResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        userMessage,
        assistantMessage,
        payment: paymentResult ? {
          charged: paymentResult.amountCharged,
          balanceRemaining: paymentResult.balanceRemaining,
        } : null,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
