/**
 * UNIFIED ENTITY DETAIL PAGE COMPONENT
 *
 * Modular, reusable server component for displaying entity detail pages.
 * Replaces duplicate detail page implementations with a single, DRY component.
 *
 * Features:
 * - Type-safe entity rendering
 * - Automatic field formatting
 * - Currency formatting with user preferences
 * - Consistent layout using EntityDetailLayout
 * - Edit/Delete actions
 * - Permission checking
 *
 * Created: 2026-01-03
 * Last Modified: 2026-01-03
 * Last Modified Summary: Initial unified entity detail page implementation
 */

import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import EntityDetailLayout from '@/components/entity/EntityDetailLayout';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getTableName } from '@/config/entity-registry';
import type { EntityConfig, BaseEntity } from '@/types/entity';
import { PLATFORM_DEFAULT_CURRENCY, isSupportedCurrency } from '@/config/currencies';
import { DATABASE_TABLES } from '@/config/database-tables';
import type { Currency } from '@/types/settings';
import { COLUMNS } from '@/config/database-columns';
import type { ReactNode } from 'react';

export interface DetailField {
  label: string;
  value: string | ReactNode;
}

interface EntityDetailPageProps<T extends BaseEntity> {
  config: EntityConfig<T>;
  entityId: string;
  userId?: string; // If provided, only show entities owned by this user
  requireAuth?: boolean; // If true, redirect to auth if not logged in
  redirectPath?: string; // Where to redirect if auth required but not logged in
  makeDetailFields?: (
    entity: T,
    userCurrency?: string
  ) => {
    left?: DetailField[];
    right?: DetailField[];
  };
}

/**
 * Format a field value based on its type
 */
function formatFieldValue(value: unknown, fieldName: string): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '—';
    }
    return value.join(', ');
  }

  // Handle dates
  if (fieldName.includes('_at') || fieldName.includes('date') || fieldName.includes('Date')) {
    try {
      const date = new Date(value as string | number | Date);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    } catch {
      // Not a valid date, continue
    }
  }

  // Handle currency fields - format numbers with locale
  if (
    fieldName.includes('price') ||
    fieldName.includes('amount') ||
    fieldName.includes('rate') ||
    fieldName.includes('goal')
  ) {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Default: string representation
  return String(value);
}

/**
 * Default detail fields generator - creates fields from entity data
 */
function makeDefaultDetailFields<T extends BaseEntity>(
  entity: T
): {
  left: DetailField[];
  right: DetailField[];
} {
  const left: DetailField[] = [];
  const right: DetailField[] = [];

  // Common fields to show on left
  const leftFields = [
    'status',
    'category',
    'type',
    'product_type',
    'service_location_type',
    'pricing',
    'price',
    'inventory_count',
    'fulfillment_type',
    'duration_minutes',
  ];
  const rightFields = ['created_at', 'updated_at', 'published_at'];

  // Add status
  if (entity.status) {
    left.push({
      label: 'Status',
      value: String(entity.status).charAt(0).toUpperCase() + String(entity.status).slice(1),
    });
  }

  // Add other common fields
  Object.entries(entity).forEach(([key, value]) => {
    // Skip base fields and internal fields
    if (
      [
        'id',
        'user_id',
        'title',
        'description',
        'thumbnail_url',
        'created_at',
        'updated_at',
      ].includes(key)
    ) {
      return;
    }

    // Skip null/undefined values
    if (value === null || value === undefined) {
      return;
    }

    const label = key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const formattedValue = formatFieldValue(value, key);

    if (leftFields.some(field => key.includes(field))) {
      left.push({ label, value: formattedValue });
    } else if (rightFields.some(field => key.includes(field))) {
      right.push({ label, value: formattedValue });
    }
  });

  // Always add timestamps to right
  if (entity.created_at) {
    right.push({
      label: 'Created',
      value: new Date(entity.created_at).toLocaleString(),
    });
  }
  if (entity.updated_at) {
    right.push({
      label: 'Updated',
      value: new Date(entity.updated_at).toLocaleString(),
    });
  }

  return { left, right };
}

export default async function EntityDetailPage<T extends BaseEntity>({
  config,
  entityId,
  userId,
  requireAuth = true,
  redirectPath,
  makeDetailFields,
}: EntityDetailPageProps<T>) {
  const supabase = await createServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (requireAuth && !user) {
    redirect(redirectPath || '/auth?mode=login');
  }

  // Get user's currency preference from profile
  let userCurrency: Currency = PLATFORM_DEFAULT_CURRENCY;
  if (user) {
    const { data: profile } = await (supabase.from(DATABASE_TABLES.PROFILES) as any)
      .select(COLUMNS.profiles.CURRENCY)
      .eq(COLUMNS.profiles.ID, user.id)
      .single();

    if (profile?.currency && isSupportedCurrency(profile.currency)) {
      userCurrency = profile.currency as Currency;
    }
  }

  // Map entity config name to EntityType for getTableName
  const entityTypeMap: Record<string, string> = {
    product: 'product',
    service: 'service',
    cause: 'cause',
    'ai assistant': 'ai_assistant',
    'ai assistants': 'ai_assistant',
    project: 'project',
    event: 'event',
    loan: 'loan',
    asset: 'asset',
  };

  const entityType = entityTypeMap[config.name.toLowerCase()] || config.name.toLowerCase();
  const tableName = getTableName(entityType as Parameters<typeof getTableName>[0]);

  // Build query
  let query = (supabase.from(tableName) as any).select('*').eq('id', entityId);

  // If userId provided, filter by user
  if (userId || (user && requireAuth)) {
    query = query.eq('user_id', userId || user!.id);
  }

  const { data: entity, error } = await query.single();

  if (error || !entity) {
    notFound();
  }

  // Check permissions (if entity has is_public field)
  if ('is_public' in entity && !entity.is_public && user && entity.user_id !== user.id) {
    notFound();
  }

  // Generate detail fields
  const fields = makeDetailFields
    ? makeDetailFields(entity as T, userCurrency)
    : makeDefaultDetailFields(entity as T);

  // Header actions
  const headerActions = (
    <Link href={config.editPath(entityId)}>
      <Button>Edit</Button>
    </Link>
  );

  return (
    <EntityDetailLayout
      title={entity.title || 'Untitled'}
      subtitle={entity.description || undefined}
      headerActions={headerActions}
      left={
        <div className="space-y-4">
          {(fields.left ?? []).length > 0 ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {(fields.left ?? []).map((field, idx) => (
                <div key={idx}>
                  <div className="text-gray-500">{field.label}</div>
                  <div className="font-medium mt-1">{field.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No additional details available.</div>
          )}
        </div>
      }
      right={
        (fields.right ?? []).length > 0 ? (
          <div className="space-y-3 text-sm">
            {(fields.right ?? []).map((field, idx) => (
              <div key={idx}>
                <div className="text-gray-500">{field.label}</div>
                <div className="font-medium mt-1">{field.value}</div>
              </div>
            ))}
          </div>
        ) : undefined
      }
    />
  );
}
