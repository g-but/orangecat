import { logger } from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { TransactionFormData } from '@/types/database';
import { transactionSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const rawBody = await request.json();

    // Validate input with Zod schema
    const body = transactionSchema.parse(rawBody);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Validate that the user has permission to create transactions for the from_entity
    let hasPermission = false;

    switch (body.from_entity_type) {
      case 'profile':
        if (body.from_entity_id === user.id) {
          hasPermission = true;
        }
        break;
      case 'project':
        // Check if user is creator of project
        const { data: project } = await supabase
          .from('projects')
          .select('user_id')
          .eq('id', body.from_entity_id)
          .single();

        if (project && project.user_id === user.id) {
          hasPermission = true;
        }
        break;
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No permission to create transactions for this entity' },
        { status: 403 }
      );
    }

    // Validate target entity exists and is eligible for transactions
    if (body.to_entity_type === 'project') {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, status')
        .eq('id', body.to_entity_id)
        .single();

      if (projectError || !project) {
        return NextResponse.json({ error: 'Target project not found' }, { status: 404 });
      }

      if (project.status !== 'active') {
        return NextResponse.json({ error: 'Cannot donate to inactive project' }, { status: 400 });
      }
    }

    if (body.to_entity_type === 'profile') {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', body.to_entity_id)
        .single();

      if (profileError || !profile) {
        return NextResponse.json({ error: 'Target profile not found' }, { status: 404 });
      }
    }

    // Additional validation: reasonable amount (prevent absurdly large transactions)
    if (body.amount_sats > 21000000 * 100000000) {
      // 21M BTC in sats
      return NextResponse.json(
        { error: 'Transaction amount exceeds maximum allowed (21M BTC)' },
        { status: 400 }
      );
    }

    // Create the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        amount_sats: body.amount_sats,
        from_entity_type: body.from_entity_type,
        from_entity_id: body.from_entity_id,
        to_entity_type: body.to_entity_type,
        to_entity_id: body.to_entity_id,
        payment_method: body.payment_method,
        message: body.message || null,
        purpose: body.purpose || null,
        anonymous: body.anonymous || false,
        public_visibility: body.public_visibility !== false, // Default to public
        status: 'pending',
        initiated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (transactionError) {
      logger.error('Transaction creation error:', transactionError);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    return NextResponse.json({ data: transaction });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      logger.warn('Transaction validation failed:', zodError.errors);
      return NextResponse.json(
        {
          error: 'Invalid transaction data',
          details: zodError.errors || zodError.message,
        },
        { status: 400 }
      );
    }

    logger.error('Transaction API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to check if user is admin of organization
// Organizations removed in MVP - no longer needed

// GET /api/transactions - Get transactions for an entity or all public transactions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const url = new URL(request.url);
    const entityType = url.searchParams.get('entity_type');
    const entityId = url.searchParams.get('entity_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (entityType && entityId) {
      // Get transactions for a specific entity
      // Check if user has permission to view this entity's transactions
      let hasPermission = false;

      if (user) {
        switch (entityType) {
          case 'profile':
            if (entityId === user.id) {
              hasPermission = true;
            }
            break;
          case 'project':
            const { data: project } = await supabase
              .from('projects')
              .select('user_id')
              .eq('id', entityId)
              .single();
            if (project && project.user_id === user.id) {
              hasPermission = true;
            }
            break;
        }
      }

      if (!hasPermission && entityType !== 'profile') {
        // For non-profile entities, check if transactions are public
        const { data: publicTransactions } = await supabase
          .from('transactions')
          .select('*')
          .or(
            `and(from_entity_type.eq.${entityType},from_entity_id.eq.${entityId}),and(to_entity_type.eq.${entityType},to_entity_id.eq.${entityId})`
          )
          .eq('public_visibility', true)
          .order('created_at', { ascending: false })
          .limit(limit)
          .range(offset, offset + limit - 1);

        return NextResponse.json({ data: publicTransactions || [] });
      }

      // Get all transactions for this entity (user has permission or it's their own profile)
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .or(
          `and(from_entity_type.eq.${entityType},from_entity_id.eq.${entityId}),and(to_entity_type.eq.${entityType},to_entity_id.eq.${entityId})`
        )
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Transaction query error:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
      }

      return NextResponse.json({ data: transactions || [] });
    }

    // Get all public transactions
    const { data: publicTransactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('public_visibility', true)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Public transactions query error:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    return NextResponse.json({ data: publicTransactions || [] });
  } catch (error) {
    logger.error('Transactions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
