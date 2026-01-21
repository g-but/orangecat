/**
 * My Cat Permissions API
 *
 * Endpoints for managing user permissions for My Cat actions.
 *
 * GET /api/cat/permissions - Get user's permission summary
 * POST /api/cat/permissions - Grant permission for an action/category
 * DELETE /api/cat/permissions - Revoke permission for an action/category
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Initial implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createPermissionService } from '@/services/cat';
import {
  CAT_ACTIONS,
  ACTION_CATEGORIES,
  ACTION_CATEGORY_KEYS,
  type ActionCategory,
} from '@/config/cat-actions';
import { z } from 'zod';

// Validation schemas - category enum derived from ACTION_CATEGORIES (DRY)
const categorySchema = z.enum(ACTION_CATEGORY_KEYS);

const grantPermissionSchema = z.object({
  actionId: z.string().min(1),
  category: categorySchema,
  requiresConfirmation: z.boolean().optional(),
  dailyLimit: z.number().int().positive().optional(),
  maxSatsPerAction: z.number().int().positive().optional(),
});

const revokePermissionSchema = z.object({
  actionId: z.string().min(1),
  category: categorySchema,
});

/**
 * GET /api/cat/permissions
 * Get user's permission summary
 */
export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const permissionService = createPermissionService(supabase);
    const summary = await permissionService.getPermissionSummary(user.id);

    // Also get available actions for the UI
    const availableActions = Object.values(CAT_ACTIONS)
      .filter(a => a.enabled)
      .map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        category: a.category,
        riskLevel: a.riskLevel,
        requiresConfirmation: a.requiresConfirmation,
      }));

    const categories = Object.entries(ACTION_CATEGORIES).map(([key, value]) => ({
      id: key,
      ...value,
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary,
        availableActions,
        categories,
      },
    });
  } catch (error) {
    console.error('[API] Get cat permissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get permissions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cat/permissions
 * Grant permission for an action or category
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = grantPermissionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const { actionId, category, requiresConfirmation, dailyLimit, maxSatsPerAction } =
      parseResult.data;

    // Validate action exists (unless granting category-wide)
    if (actionId !== '*') {
      const action = CAT_ACTIONS[actionId];
      if (!action) {
        return NextResponse.json(
          { success: false, error: `Unknown action: ${actionId}` },
          { status: 400 }
        );
      }
      if (action.category !== category) {
        return NextResponse.json(
          { success: false, error: `Action ${actionId} is not in category ${category}` },
          { status: 400 }
        );
      }
    }

    const permissionService = createPermissionService(supabase);

    if (actionId === '*') {
      // Grant category-wide permission
      await permissionService.grantCategory(user.id, category as ActionCategory, {
        requiresConfirmation: requiresConfirmation ?? true,
        dailyLimit,
      });
    } else {
      // Grant specific action permission
      await permissionService.grantPermission(user.id, actionId, category as ActionCategory, {
        requiresConfirmation: requiresConfirmation ?? true,
        dailyLimit,
        maxSatsPerAction,
      });
    }

    // Return updated summary
    const summary = await permissionService.getPermissionSummary(user.id);

    return NextResponse.json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    console.error('[API] Grant cat permission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to grant permission' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cat/permissions
 * Revoke permission for an action or category
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = revokePermissionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const { actionId, category } = parseResult.data;

    const permissionService = createPermissionService(supabase);

    if (actionId === '*') {
      // Revoke category-wide permission
      await permissionService.revokeCategory(user.id, category as ActionCategory);
    } else {
      // Revoke specific action permission
      await permissionService.revokePermission(user.id, actionId, category as ActionCategory);
    }

    // Return updated summary
    const summary = await permissionService.getPermissionSummary(user.id);

    return NextResponse.json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    console.error('[API] Revoke cat permission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to revoke permission' },
      { status: 500 }
    );
  }
}
