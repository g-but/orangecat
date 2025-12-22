import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/database';
import { logger } from '@/utils/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

type Table = 'user_products' | 'user_services';
type SupabaseInstance = SupabaseClient<Database>;

interface ListParams {
  limit?: number;
  offset?: number;
  category?: string | null;
  userId?: string | null;
  includeOwnDrafts?: boolean;
}

export async function listEntities(table: Table, params: ListParams) {
  const supabase = await createServerClient();
  const { limit = 20, offset = 0, category, userId, includeOwnDrafts } = params;

  let query = supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId && includeOwnDrafts) {
    query = query.eq('user_id', userId);
  } else {
    // public list: status = active
    query = query.eq('status', 'active');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (category) {
      query = query.eq('category', category);
    }
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return data || [];
}

export async function listEntitiesPage(
  table: Table,
  params: ListParams & { limit: number; offset: number }
) {
  const supabase = await createServerClient();
  const { limit, offset, category, userId, includeOwnDrafts } = params;

  // base query for items
  let itemsQuery = supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // base query for count (head=true)
  let countQuery = supabase.from(table).select('*', { count: 'exact', head: true });

  if (userId && includeOwnDrafts) {
    itemsQuery = itemsQuery.eq('user_id', userId);
    countQuery = countQuery.eq('user_id', userId);
  } else {
    itemsQuery = itemsQuery.eq('status', 'active');
    countQuery = countQuery.eq('status', 'active');
    if (userId) {
      itemsQuery = itemsQuery.eq('user_id', userId);
      countQuery = countQuery.eq('user_id', userId);
    }
    if (category) {
      itemsQuery = itemsQuery.eq('category', category);
      countQuery = countQuery.eq('category', category);
    }
  }

  const [{ data: items, error: itemsError }, { count, error: countError }] = await Promise.all([
    itemsQuery,
    countQuery,
  ]);
  if (itemsError) {
    throw itemsError;
  }
  if (countError) {
    throw countError;
  }

  return { items: items || [], total: count || 0, limit, offset };
}

interface CreateProductInput {
  title: string;
  description?: string | null;
  price_sats: number;
  currency?: 'SATS' | 'BTC';
  product_type?: 'physical' | 'digital' | 'service';
  images?: string[];
  thumbnail_url?: string | null;
  inventory_count?: number;
  fulfillment_type?: 'manual' | 'automatic' | 'digital';
  category?: string | null;
  tags?: string[];
  is_featured?: boolean;
}

interface CreateServiceInput {
  title: string;
  description?: string | null;
  category: string;
  hourly_rate_sats?: number | null;
  fixed_price_sats?: number | null;
  currency?: 'SATS' | 'BTC';
  duration_minutes?: number | null;
  availability_schedule?: any;
  service_location_type?: 'remote' | 'onsite' | 'both';
  service_area?: string | null;
  images?: string[];
  portfolio_links?: string[];
}

export async function createProduct(
  userId: string,
  input: CreateProductInput,
  _client?: SupabaseInstance
) {
  // Always write to DB unless explicitly overridden with PRODUCTS_WRITE_MODE=mock
  const mode = process.env.PRODUCTS_WRITE_MODE || 'db';
  if (mode === 'mock') {
    throw new Error('Mock mode is disabled by policy. Set PRODUCTS_WRITE_MODE=db');
  }

  // Use admin client for write operations - auth is already verified by the API route
  const adminClient = createAdminClient();
  const payload = {
    user_id: userId,
    status: 'draft' as const,
    currency: input.currency ?? 'SATS',
    product_type: input.product_type ?? 'physical',
    images: input.images ?? [],
    thumbnail_url: input.thumbnail_url ?? null,
    inventory_count: input.inventory_count ?? -1,
    fulfillment_type: input.fulfillment_type ?? 'manual',
    category: input.category,
    tags: input.tags ?? [],
    is_featured: input.is_featured ?? false,
    title: input.title,
    description: input.description ?? null,
    price_sats: input.price_sats,
  };
  const { data, error } = await adminClient.from('user_products').insert(payload).select().single();
  if (error) {
    logger.error('Product creation failed', { error, userId });
    throw error;
  }
  return data;
}

export async function createService(
  userId: string,
  input: CreateServiceInput,
  _client?: SupabaseInstance
) {
  // Use admin client for write operations - auth is already verified by the API route
  const adminClient = createAdminClient();

  const payload = {
    user_id: userId,
    title: input.title,
    description: input.description ?? null,
    category: input.category,
    hourly_rate_sats: input.hourly_rate_sats ?? null,
    fixed_price_sats: input.fixed_price_sats ?? null,
    currency: input.currency ?? 'SATS',
    duration_minutes: input.duration_minutes ?? null,
    availability_schedule: input.availability_schedule,
    service_location_type: input.service_location_type ?? 'remote',
    service_area: input.service_area ?? null,
    images: input.images ?? [],
    portfolio_links: input.portfolio_links ?? [],
    status: 'draft' as const,
  };

  const { data, error } = await adminClient.from('user_services').insert(payload).select().single();
  if (error) {
    logger.error('Service creation failed', { error, userId });
    throw error;
  }
  return data;
}

interface CreateCircleInput {
  name: string;
  description?: string | null;
  category: string;
  visibility?: 'public' | 'private' | 'hidden';
  max_members?: number | null;
  member_approval?: 'auto' | 'manual' | 'invite';
  location_restricted?: boolean;
  location_radius_km?: number | null;
  bitcoin_address?: string | null;
  wallet_purpose?: string | null;
  contribution_required?: boolean;
  contribution_amount?: number | null;
  activity_level?: 'casual' | 'regular' | 'intensive';
  meeting_frequency?: 'none' | 'weekly' | 'monthly' | 'quarterly';
  enable_projects?: boolean;
  enable_events?: boolean;
  enable_discussions?: boolean;
  require_member_intro?: boolean;
}

export async function createCircle(
  userId: string,
  input: CreateCircleInput,
  _client?: SupabaseInstance
) {
  // Use admin client for write operations - auth is already verified by the API route
  const adminClient = createAdminClient();
  const payload = {
    name: input.name,
    description: input.description ?? null,
    category: input.category,
    visibility: input.visibility ?? 'private',
    max_members: input.max_members ?? null,
    member_approval: input.member_approval ?? 'manual',
    location_restricted: input.location_restricted ?? false,
    location_radius_km: input.location_radius_km ?? null,
    bitcoin_address: input.bitcoin_address ?? null,
    wallet_purpose: input.wallet_purpose ?? null,
    contribution_required: input.contribution_required ?? false,
    contribution_amount: input.contribution_amount ?? null,
    activity_level: input.activity_level ?? 'regular',
    meeting_frequency: input.meeting_frequency ?? 'none',
    enable_projects: input.enable_projects ?? false,
    enable_events: input.enable_events ?? true,
    enable_discussions: input.enable_discussions ?? true,
    require_member_intro: input.require_member_intro ?? false,
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await adminClient.from('circles').insert(payload).select().single();
  if (error) {
    logger.error('Circle creation failed', { error, userId });
    throw error;
  }
  return data;
}

interface CreateOrganizationInput {
  name: string;
  slug: string;
  description?: string | null;
  type:
    | 'dao'
    | 'company'
    | 'nonprofit'
    | 'community'
    | 'cooperative'
    | 'foundation'
    | 'collective'
    | 'guild'
    | 'syndicate'
    | 'circle';
  category?: string | null;
  tags?: string[];
  governance_model?:
    | 'hierarchical'
    | 'flat'
    | 'democratic'
    | 'consensus'
    | 'liquid_democracy'
    | 'quadratic_voting'
    | 'stake_weighted'
    | 'reputation_based';
  treasury_address?: string | null;
  website_url?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  is_public?: boolean;
  requires_approval?: boolean;
  settings?: Record<string, any>;
  contact_info?: Record<string, any>;
}

export async function createOrganization(
  userId: string,
  input: CreateOrganizationInput,
  _client?: SupabaseInstance
) {
  // Use admin client for write operations - auth is already verified by the API route
  const adminClient = createAdminClient();
  const payload = {
    profile_id: userId,
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    type: input.type,
    category: input.category ?? null,
    tags: input.tags ?? [],
    governance_model: input.governance_model ?? 'hierarchical',
    treasury_address: input.treasury_address ?? null,
    website_url: input.website_url ?? null,
    avatar_url: input.avatar_url ?? null,
    banner_url: input.banner_url ?? null,
    is_public: input.is_public ?? true,
    requires_approval: input.requires_approval ?? true,
    verification_level: 0,
    trust_score: 0.0,
    settings: input.settings ?? {},
    contact_info: input.contact_info ?? {},
    application_process: { questions: [] },
    founded_at: new Date().toISOString(),
  };
  const { data, error } = await adminClient.from('organizations').insert(payload).select().single();
  if (error) {
    logger.error('Organization creation failed', { error, userId });
    throw error;
  }
  logger.info('Organization created successfully', { organizationId: data.id, userId });
  return data;
}
