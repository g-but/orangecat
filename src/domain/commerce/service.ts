import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UserProduct, UserService, UserCause } from '@/types/database';
import { logger } from '@/utils/logger';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getTableName } from '@/config/entity-registry';

// Table type - using entity registry table names
// These are the actual table names from the database
// Accept string to allow dynamic table names from entity registry
type Table = string;
// Type alias for SupabaseClient parameter - unused but kept for API compatibility
type _SupabaseInstance = SupabaseClient;

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

  // Using dynamic table access - type assertion needed for entity registry pattern
  let query = supabase.from(table)
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

  // base query for items - dynamic table access for entity registry pattern
  let itemsQuery = supabase.from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // base query for count (head=true) - dynamic table access
  let countQuery = supabase.from(table).select('*', { count: 'exact', head: true });

  // Circles table doesn't have a 'status' column like commerce tables
  const isCirclesTable = table === 'circles';

  if (userId && includeOwnDrafts) {
    itemsQuery = itemsQuery.eq('user_id', userId);
    countQuery = countQuery.eq('user_id', userId);
  } else if (isCirclesTable) {
    // For circles, filter by visibility and created_by for user filtering
    itemsQuery = itemsQuery.eq('visibility', 'public');
    countQuery = countQuery.eq('visibility', 'public');
    if (userId) {
      itemsQuery = itemsQuery.eq('created_by', userId);
      countQuery = countQuery.eq('created_by', userId);
    }
    if (category) {
      itemsQuery = itemsQuery.eq('category', category);
      countQuery = countQuery.eq('category', category);
    }
  } else {
    // For commerce tables (user_products, user_services, user_causes)
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

  const [{ data: items, error: itemsError }, { count: _count, error: countError }] = await Promise.all([
    itemsQuery,
    countQuery,
  ]);
  if (itemsError) {
    throw itemsError;
  }
  if (countError) {
    throw countError;
  }

  // Filter out example/test data after fetching
  // TODO: Add is_example field to database and filter at query level
  const exampleTitles = ["Assassin's Creed", 'Example Service', 'Test Service', 'Sample Service'];
  const filteredItems = (items || []).filter((item: { title?: string; name?: string }) => {
    const title = item.title || item.name || '';
    return !exampleTitles.some(exampleTitle =>
      title.toLowerCase().includes(exampleTitle.toLowerCase())
    );
  });

  return { items: filteredItems, total: filteredItems.length, limit, offset };
}

interface CreateProductInput {
  title: string;
  description?: string | null;
  price: number;
  currency?: 'SATS' | 'BTC' | 'USD' | 'EUR' | 'CHF';
  product_type?: 'physical' | 'digital' | 'service';
  images?: string[];
  thumbnail_url?: string | null;
  inventory_count?: number;
  fulfillment_type?: 'manual' | 'automatic' | 'digital';
  category?: string | null;
  tags?: string[];
  is_featured?: boolean;
}

interface AvailabilitySchedule {
  days?: string[];
  hours?: { start: string; end: string }[];
  timezone?: string;
  [key: string]: unknown;
}

interface CreateServiceInput {
  title: string;
  description?: string | null;
  category: string;
  hourly_rate?: number | null;
  fixed_price?: number | null;
  currency?: 'SATS' | 'BTC' | 'USD' | 'EUR' | 'CHF';
  duration_minutes?: number | null;
  availability_schedule?: AvailabilitySchedule;
  service_location_type?: 'remote' | 'onsite' | 'both';
  service_area?: string | null;
  images?: string[];
  portfolio_links?: string[];
}

export async function createProduct(
  userId: string,
  input: CreateProductInput
): Promise<UserProduct> {
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
    price: input.price,
  };
  // Using dynamic table access for entity registry pattern - type assertion required
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (adminClient.from(getTableName('product')) as any)
    .insert(payload)
    .select()
    .single();
  const { data, error } = result as { data: UserProduct | null; error: unknown };
  if (error) {
    logger.error('Product creation failed', { error, userId });
    throw error;
  }
  return data as UserProduct;
}

export async function createService(
  userId: string,
  input: CreateServiceInput
): Promise<UserService> {
  // Use admin client for write operations - auth is already verified by the API route
  const adminClient = createAdminClient();

  const payload = {
    user_id: userId,
    title: input.title,
    description: input.description ?? null,
    category: input.category,
    hourly_rate: input.hourly_rate ?? null,
    fixed_price: input.fixed_price ?? null,
    currency: input.currency ?? 'CHF',
    duration_minutes: input.duration_minutes ?? null,
    availability_schedule: input.availability_schedule,
    service_location_type: input.service_location_type ?? 'remote',
    service_area: input.service_area ?? null,
    images: input.images ?? [],
    portfolio_links: input.portfolio_links ?? [],
    status: 'draft' as const,
  };

  // Using dynamic table access for entity registry pattern - type assertion required
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (adminClient.from(getTableName('service')) as any)
    .insert(payload)
    .select()
    .single();
  const { data, error } = result as { data: UserService | null; error: unknown };
  if (error) {
    logger.error('Service creation failed', { error, userId });
    throw error;
  }
  return data as UserService;
}

interface DistributionRules {
  type?: 'equal' | 'weighted' | 'custom';
  allocations?: Record<string, number>;
  [key: string]: unknown;
}

interface Beneficiary {
  id?: string;
  name?: string;
  address?: string;
  share?: number;
  [key: string]: unknown;
}

interface CreateCauseInput {
  title: string;
  description?: string | null;
  cause_category: string;
  goal_amount?: number | null;
  currency?: 'SATS' | 'BTC' | 'USD' | 'EUR' | 'CHF';
  bitcoin_address?: string | null;
  lightning_address?: string | null;
  distribution_rules?: DistributionRules;
  beneficiaries?: Beneficiary[];
}

export async function createCause(
  userId: string,
  input: CreateCauseInput
): Promise<UserCause> {
  // Use admin client for write operations - auth is already verified by the API route
  const adminClient = createAdminClient();

  const payload = {
    user_id: userId,
    title: input.title,
    description: input.description ?? null,
    cause_category: input.cause_category,
    goal_amount: input.goal_amount ?? null,
    currency: input.currency ?? 'CHF',
    bitcoin_address: input.bitcoin_address ?? null,
    lightning_address: input.lightning_address ?? null,
    distribution_rules: input.distribution_rules,
    beneficiaries: input.beneficiaries ?? [],
    status: 'draft' as const,
    total_raised: 0,
  };

  // Using dynamic table access for entity registry pattern - type assertion required
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (adminClient.from(getTableName('cause')) as any)
    .insert(payload)
    .select()
    .single();
  const { data, error } = result as { data: UserCause | null; error: unknown };
  if (error) {
    logger.error('Cause creation failed', { error, userId });
    throw error;
  }
  return data as UserCause;
}

// createCircle function removed - use groups service instead
// Circles are now unified as groups (type='circle') in the organizations table

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
  settings?: Record<string, unknown>;
  contact_info?: Record<string, unknown>;
}

export async function createOrganization(
  userId: string,
  input: CreateOrganizationInput
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
  // Using dynamic table access for entity registry pattern - type assertion required
  interface OrganizationResult {
    id: string;
    [key: string]: unknown;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (adminClient.from(getTableName('group')) as any)
    .insert(payload)
    .select()
    .single();
  const { data, error } = result as { data: OrganizationResult | null; error: unknown };
  if (error) {
    logger.error('Organization creation failed', { error, userId });
    throw error;
  }
  logger.info('Organization created successfully', { organizationId: data?.id, userId });
  return data;
}
