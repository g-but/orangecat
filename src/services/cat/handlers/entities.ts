import { ENTITY_REGISTRY } from '@/config/entity-registry';
import type { ActionHandler } from './types';

export const entityHandlers: Record<string, ActionHandler> = {
  create_product: async (supabase, _userId, actorId, params) => {
    // DB column is `price` (numeric), not `price_btc`
    const price = (params.price_btc as number | null) ?? (params.price as number | null) ?? null;

    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.product.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        price,
        currency: 'BTC',
        product_type: 'physical',
        images: [],
        fulfillment_type: 'manual',
        category: params.category || null,
        status: params.publish ? 'active' : 'draft',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    const title = params.title as string;
    const statusLabel = params.publish ? 'live' : 'draft';
    return { success: true, data: { ...data, displayMessage: `🛍️ Product "${title}" created (${statusLabel})` } };
  },

  create_service: async (supabase, _userId, actorId, params) => {
    // DB columns are `hourly_rate` and `fixed_price` (no _btc suffix)
    const priceField = params.hourly_rate
      ? { hourly_rate: params.hourly_rate as number }
      : params.fixed_price
        ? { fixed_price: params.fixed_price as number }
        : params.hourly_rate_btc
          ? { hourly_rate: params.hourly_rate_btc }
          : { fixed_price: params.fixed_price_btc ?? params.price_btc ?? null };

    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.service.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        ...priceField,
        currency: 'BTC',
        duration_minutes: params.duration_minutes || null,
        service_location_type: 'remote',
        images: [],
        portfolio_links: [],
        status: params.publish ? 'active' : 'draft',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    const title = params.title as string;
    const statusLabel = params.publish ? 'live' : 'draft';
    return { success: true, data: { ...data, displayMessage: `🔧 Service "${title}" created (${statusLabel})` } };
  },

  create_project: async (supabase, _userId, actorId, params) => {
    // DB columns are `goal_amount` + `currency`, not `goal_btc`
    const goalAmount = (params.goal_btc as number | null) ?? (params.goal_amount as number | null) ?? null;

    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.project.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        goal_amount: goalAmount,
        currency: 'BTC',
        category: params.category || null,
        status: params.publish ? 'active' : 'draft',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    const title = params.title as string;
    const statusLabel = params.publish ? 'live' : 'draft';
    return { success: true, data: { ...data, displayMessage: `🚀 Project "${title}" created (${statusLabel})` } };
  },

  create_cause: async (supabase, _userId, actorId, params) => {
    // DB column is `cause_category` (not `category`); target_amount is the funding goal
    const targetAmount = (params.goal_btc as number | null) ?? (params.target_amount as number | null) ?? (params.goal_amount as number | null) ?? null;
    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.cause.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        cause_category: (params.cause_category as string | null) ?? (params.category as string | null) ?? null,
        target_amount: targetAmount,
        currency: 'BTC',
        status: params.publish ? 'active' : 'draft',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    const title = params.title as string;
    const statusLabel = params.publish ? 'live' : 'draft';
    return { success: true, data: { ...data, displayMessage: `❤️ Cause "${title}" created (${statusLabel})` } };
  },

  create_event: async (supabase, _userId, actorId, params) => {
    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.event.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        start_date: params.start_date,
        location: params.location,
        status: params.publish ? 'active' : 'draft',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    const title = params.title as string;
    const statusLabel = params.publish ? 'live' : 'draft';
    return { success: true, data: { ...data, displayMessage: `📅 Event "${title}" created (${statusLabel})` } };
  },

  create_asset: async (supabase, _userId, actorId, params) => {
    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.asset.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        type: params.asset_type || null,
        location: params.location || null,
        currency: 'BTC',
        verification_status: 'unverified',
        public_visibility: false,
        status: params.publish ? 'active' : 'draft',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    const title = params.title as string;
    return { success: true, data: { ...data, displayMessage: `🏠 Asset "${title}" registered` } };
  },

  create_investment: async (supabase, _userId, actorId, params) => {
    // DB columns: target_amount + currency (not target_amount_btc), minimum_investment.
    // Published investments use status='open' (not 'active') per investments status enum.
    const targetAmount = (params.target_amount_btc as number | null) ?? (params.target_amount as number | null) ?? null;
    const minimumInvestment = (params.minimum_investment_btc as number | null) ?? (params.minimum_investment as number | null) ?? 0.0001;

    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.investment.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: params.description || null,
        investment_type: (params.investment_type as string) || 'revenue_share',
        target_amount: targetAmount,
        minimum_investment: minimumInvestment,
        currency: 'BTC',
        total_raised: 0,
        investor_count: 0,
        is_public: Boolean(params.publish),
        status: params.publish ? 'open' : 'draft',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    const title = params.title as string;
    const statusLabel = params.publish ? 'open' : 'draft';
    return { success: true, data: { ...data, displayMessage: `📈 Investment "${title}" created (${statusLabel})` } };
  },

  create_loan: async (supabase, userId, actorId, params) => {
    // Loans table has both actor_id (added by migration) and user_id (original).
    // amount_btc → original_amount + remaining_balance (BTC decimal columns).
    // amount_sats is the legacy satoshi column; kept in sync via conversion.
    const amountBtc = (params.amount_btc as number) ?? 0;
    const amountSats = Math.round(amountBtc * 100_000_000);

    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.loan.tableName)
      .insert({
        actor_id: actorId,
        user_id: userId,
        title: params.title,
        description: params.description || null,
        loan_type: (params.loan_type as string) || 'new_request',
        original_amount: amountBtc,
        remaining_balance: amountBtc,
        amount_sats: amountSats,
        currency: 'BTC',
        interest_rate: (params.interest_rate as number | undefined) ?? null,
        fulfillment_type: 'manual',
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    const title = params.title as string;
    const rateNote = params.interest_rate ? ` at ${params.interest_rate}% interest` : '';
    return { success: true, data: { ...data, displayMessage: `💰 Loan request "${title}" created${rateNote}` } };
  },

  create_wishlist: async (supabase, _userId, actorId, params) => {
    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.wishlist.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        description: (params.description as string | null) || null,
        type: (params.type as string) || 'general',
        visibility: (params.visibility as string) || 'public',
        is_active: true,
        event_date: (params.event_date as string | null) || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    const title = params.title as string;
    return { success: true, data: { ...data, displayMessage: `🎁 Wishlist "${title}" created` } };
  },

  create_research: async (supabase, userId, _actorId, params) => {
    // research_entities uses user_id (references profiles), NOT actor_id
    // Many NOT NULL fields require sensible defaults when the Cat caller omits them.
    const fundingGoalBtc =
      (params.funding_goal_btc as number | null) ?? (params.funding_goal as number | null) ?? 0.001;

    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.research.tableName)
      .insert({
        user_id: userId,
        title: params.title,
        description: params.description || null,
        field: (params.field as string) || 'other',
        methodology: (params.methodology as string) || 'experimental',
        expected_outcome: (params.expected_outcome as string) || (params.description as string) || '',
        timeline: (params.timeline as string) || 'medium_term',
        funding_goal_btc: fundingGoalBtc,
        funding_raised_btc: 0,
        funding_model: (params.funding_model as string) || 'donation',
        wallet_address: null,
        lead_researcher: (params.lead_researcher as string) || '',
        team_members: [],
        open_collaboration: true,
        resource_needs: [],
        progress_frequency: (params.progress_frequency as string) || 'monthly',
        transparency_level: (params.transparency_level as string) || 'progress',
        voting_enabled: true,
        impact_areas: [],
        target_audience: [],
        sdg_alignment: [],
        status: 'draft',
        is_public: true,
        is_featured: false,
        completion_percentage: 0,
        days_active: 0,
        funding_velocity: 0,
        follower_count: 0,
        share_count: 0,
        citation_count: 0,
        total_votes: 0,
        total_contributors: 0,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    const resTitle = params.title as string;
    const field = params.field ? ` [${params.field}]` : '';
    return { success: true, data: { ...data, displayMessage: `🔬 Research "${resTitle}"${field} created` } };
  },

  update_entity: async (supabase, _userId, actorId, params) => {
    const entityType = params.entity_type as string;
    const entityId = params.entity_id as string;
    const updates = (
      typeof params.updates === 'string' ? JSON.parse(params.updates) : params.updates
    ) as Record<string, unknown>;

    const meta = ENTITY_REGISTRY[entityType as keyof typeof ENTITY_REGISTRY];
    if (!meta) {
      return { success: false, error: `Unknown entity type: ${entityType}` };
    }

    // Only allow updating safe fields.
    // cause_category is the causes-specific equivalent of category (causes table has no generic `category` column).
    const safeFields = ['title', 'description', 'category', 'cause_category', 'status', 'tags'];
    const safeUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (safeFields.includes(key)) {
        safeUpdates[key] = value;
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return { success: false, error: 'No valid fields to update' };
    }

    const { data, error } = await supabase
      .from(meta.tableName)
      .update(safeUpdates)
      .eq('id', entityId)
      .eq('actor_id', actorId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    const updatedTitle = (data as Record<string, unknown>)?.title as string | undefined;
    const updatedFields = Object.keys(safeUpdates).join(', ');
    return {
      success: true,
      data: {
        ...data,
        displayMessage: `✏️ Updated "${updatedTitle ?? entityType}" — ${updatedFields}`,
      },
    };
  },

  publish_entity: async (supabase, _userId, actorId, params) => {
    const entityType = params.entity_type as string;
    const entityId = params.entity_id as string;

    const meta = ENTITY_REGISTRY[entityType as keyof typeof ENTITY_REGISTRY];
    if (!meta) {
      return { success: false, error: `Unknown entity type: ${entityType}` };
    }

    const { data, error } = await supabase
      .from(meta.tableName)
      .update({ status: 'active' })
      .eq('id', entityId)
      .eq('actor_id', actorId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    const title = (data as Record<string, unknown>)?.title as string | undefined;
    const entityLabel = meta.name ?? entityType;
    return {
      success: true,
      data: {
        ...data,
        displayMessage: `✅ "${title ?? entityLabel}" is now live!`,
      },
    };
  },

  archive_entity: async (supabase, _userId, actorId, params) => {
    // Soft-delete: set status to 'archived'. Reversible. Works for all entity types.
    // Uses actor_id ownership guard so users can only archive their own entities.
    const entityType = params.entity_type as string;
    const entityId = params.entity_id as string;

    const meta = ENTITY_REGISTRY[entityType as keyof typeof ENTITY_REGISTRY];
    if (!meta) {
      return { success: false, error: `Unknown entity type: ${entityType}` };
    }

    const { data, error } = await supabase
      .from(meta.tableName)
      .update({ status: 'archived' })
      .eq('id', entityId)
      .eq('actor_id', actorId)
      .select('id, title, status')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const title = (data as Record<string, unknown>)?.title as string | undefined;
    return {
      success: true,
      data: {
        ...data,
        displayMessage: `🗂️ "${title ?? entityId}" has been archived and removed from public view`,
      },
    };
  },
};
