import { logger } from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db';
import { TransactionFormData } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body: TransactionFormData = await request.json();

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
      case 'organization':
        // Check if user is admin/owner of the organization
        const { data: membership } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', body.from_entity_id)
          .eq('profile_id', user.id)
          .eq('status', 'active')
          .single();

        if (membership && ['owner', 'admin'].includes(membership.role)) {
          hasPermission = true;
        }
        break;
      case 'project':
        // Check if user is creator or org admin for project
        const { data: project } = await supabase
          .from('projects')
          .select('user_id, organization_id')
          .eq('id', body.from_entity_id)
          .single();

        if (
          project &&
          (project.user_id === user.id ||
            (project.organization_id &&
              (await checkOrgAdmin(supabase, project.organization_id, user.id))))
        ) {
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
    logger.error('Transaction API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to check if user is admin of organization
async function checkOrgAdmin(
  supabase: any,
  organizationId: string,
  userId: string
): Promise<boolean> {
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('profile_id', userId)
    .eq('status', 'active')
    .single();

  return membership && ['owner', 'admin'].includes(membership.role);
}

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
          case 'organization':
            const { data: membership } = await supabase
              .from('organization_members')
              .select('role')
              .eq('organization_id', entityId)
              .eq('profile_id', user.id)
              .eq('status', 'active')
              .single();
            if (membership) {
              hasPermission = true;
            }
            break;
          case 'project':
            const { data: project } = await supabase
              .from('projects')
              .select('user_id, organization_id')
              .eq('id', entityId)
              .single();
            if (
              project &&
              (project.user_id === user.id ||
                (project.organization_id &&
                  (await checkOrgAdmin(supabase, project.organization_id, user.id))))
            ) {
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
