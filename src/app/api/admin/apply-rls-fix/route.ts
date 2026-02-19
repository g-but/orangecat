/**
 * Admin API Route: Apply RLS Fix
 *
 * Applies the group_members RLS recursion fix migration.
 * Requires authenticated admin user.
 *
 * Created: 2025-12-31
 * Last Modified: 2026-02-09
 * Last Modified Summary: Added admin auth guard to prevent unauthorized access
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '@/utils/logger';

export async function POST(_req: NextRequest) {
  try {
    // Admin auth guard: require authenticated admin user
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const isAdmin = user.email?.endsWith('@orangecat.ch') && user.app_metadata?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: admin access required' },
        { status: 403 }
      );
    }

    const _admin = createAdminClient();

    // Read the migration file
    const migrationPath = join(
      process.cwd(),
      'supabase/migrations/20250130000007_fix_group_members_rls_recursion.sql'
    );
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    logger.info('Applying RLS fix migration', {}, 'Admin/ApplyRLSFix');

    // Execute the migration SQL using the admin client
    // Note: Supabase JS client doesn\'t support direct DDL execution
    // We need to use the Management API or apply via SQL editor
    // For now, return the SQL so it can be applied manually or via another method

    return NextResponse.json({
      success: true,
      message: 'Migration SQL ready. Please apply via Supabase Studio.',
      sql: migrationSQL,
      instructions: [
        '1. Go to: https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql/new',
        '2. Copy the SQL from the response',
        '3. Paste and execute',
      ],
    });
  } catch (error) {
    logger.error('Failed to prepare RLS fix migration', error, 'Admin/ApplyRLSFix');
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
