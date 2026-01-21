/**
 * My Cat Permission Service
 *
 * Manages user permissions for My Cat actions.
 * Users can grant/revoke permissions for specific action categories or individual actions.
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Initial implementation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { CAT_ACTIONS, ACTION_CATEGORIES, type ActionCategory } from '@/config/cat-actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// ==================== TYPES ====================

export interface CatPermission {
  id: string;
  user_id: string;
  action_id: string; // Specific action ID or '*' for category-wide
  category: ActionCategory;
  granted: boolean;
  requires_confirmation: boolean; // Override: always confirm even if action doesn't require it
  daily_limit?: number; // Max executions per day (null = unlimited)
  max_sats_per_action?: number; // Max sats for payment actions
  created_at: string;
  updated_at: string;
}

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  requiresConfirmation: boolean;
  dailyUsage?: number;
  dailyLimit?: number;
}

export interface UserPermissionSummary {
  categories: {
    category: ActionCategory;
    name: string;
    description: string;
    enabled: boolean;
    actionCount: number;
    enabledActionCount: number;
  }[];
  totalActions: number;
  enabledActions: number;
  highRiskEnabled: boolean;
}

// Default permissions for new users - conservative by default
const DEFAULT_PERMISSIONS: Partial<Record<ActionCategory, boolean>> = {
  context: true, // Can manage their own context
  entities: false, // Must explicitly enable
  communication: false,
  payments: false, // High risk - never default
  organization: false,
  settings: false,
};

// ==================== SERVICE ====================

export class CatPermissionService {
  constructor(private supabase: AnySupabaseClient) {}

  /**
   * Check if a user has permission to execute an action
   */
  async checkPermission(userId: string, actionId: string): Promise<PermissionCheck> {
    const action = CAT_ACTIONS[actionId];
    if (!action) {
      return { allowed: false, reason: 'Unknown action', requiresConfirmation: true };
    }

    if (!action.enabled) {
      return { allowed: false, reason: 'Action is disabled', requiresConfirmation: true };
    }

    // Check for specific action permission first
    const { data: specificPerm } = await this.supabase
      .from('cat_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('action_id', actionId)
      .maybeSingle();

    if (specificPerm) {
      if (!specificPerm.granted) {
        return {
          allowed: false,
          reason: 'Permission denied for this action',
          requiresConfirmation: true,
        };
      }

      // Check daily limit
      if (specificPerm.daily_limit) {
        const usage = await this.getDailyUsage(userId, actionId);
        if (usage >= specificPerm.daily_limit) {
          return {
            allowed: false,
            reason: `Daily limit reached (${usage}/${specificPerm.daily_limit})`,
            requiresConfirmation: true,
            dailyUsage: usage,
            dailyLimit: specificPerm.daily_limit,
          };
        }
      }

      return {
        allowed: true,
        requiresConfirmation: specificPerm.requires_confirmation ?? action.requiresConfirmation,
        dailyUsage: specificPerm.daily_limit
          ? await this.getDailyUsage(userId, actionId)
          : undefined,
        dailyLimit: specificPerm.daily_limit ?? undefined,
      };
    }

    // Check category-wide permission
    const { data: categoryPerm } = await this.supabase
      .from('cat_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('action_id', '*')
      .eq('category', action.category)
      .maybeSingle();

    if (categoryPerm) {
      if (!categoryPerm.granted) {
        return {
          allowed: false,
          reason: `Permission denied for ${action.category} actions`,
          requiresConfirmation: true,
        };
      }

      return {
        allowed: true,
        requiresConfirmation: categoryPerm.requires_confirmation ?? action.requiresConfirmation,
      };
    }

    // Fall back to defaults
    const defaultAllowed = DEFAULT_PERMISSIONS[action.category] ?? false;
    return {
      allowed: defaultAllowed,
      reason: defaultAllowed ? undefined : 'Permission not granted',
      requiresConfirmation: action.requiresConfirmation,
    };
  }

  /**
   * Get daily usage count for an action
   */
  async getDailyUsage(userId: string, actionId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await this.supabase
      .from('cat_action_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action_id', actionId)
      .gte('created_at', today.toISOString());

    return count || 0;
  }

  /**
   * Grant permission for an action or category
   */
  async grantPermission(
    userId: string,
    actionId: string,
    category: ActionCategory,
    options: {
      requiresConfirmation?: boolean;
      dailyLimit?: number;
      maxSatsPerAction?: number;
    } = {}
  ): Promise<CatPermission> {
    const { data, error } = await this.supabase
      .from('cat_permissions')
      .upsert(
        {
          user_id: userId,
          action_id: actionId,
          category,
          granted: true,
          requires_confirmation: options.requiresConfirmation ?? true,
          daily_limit: options.dailyLimit ?? null,
          max_sats_per_action: options.maxSatsPerAction ?? null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,action_id,category',
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to grant permission: ${error.message}`);
    }

    return data;
  }

  /**
   * Revoke permission for an action or category
   */
  async revokePermission(
    userId: string,
    actionId: string,
    category: ActionCategory
  ): Promise<void> {
    const { error } = await this.supabase.from('cat_permissions').upsert(
      {
        user_id: userId,
        action_id: actionId,
        category,
        granted: false,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,action_id,category',
      }
    );

    if (error) {
      throw new Error(`Failed to revoke permission: ${error.message}`);
    }
  }

  /**
   * Grant all permissions for a category
   */
  async grantCategory(
    userId: string,
    category: ActionCategory,
    options: { requiresConfirmation?: boolean; dailyLimit?: number } = {}
  ): Promise<void> {
    await this.grantPermission(userId, '*', category, options);
  }

  /**
   * Revoke all permissions for a category
   */
  async revokeCategory(userId: string, category: ActionCategory): Promise<void> {
    // Remove category-wide permission
    await this.revokePermission(userId, '*', category);

    // Also revoke all specific actions in this category
    const { error } = await this.supabase
      .from('cat_permissions')
      .update({ granted: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('category', category);

    if (error) {
      throw new Error(`Failed to revoke category: ${error.message}`);
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<CatPermission[]> {
    const { data, error } = await this.supabase
      .from('cat_permissions')
      .select('*')
      .eq('user_id', userId)
      .order('category');

    if (error) {
      throw new Error(`Failed to get permissions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get permission summary for a user (for UI display)
   */
  async getPermissionSummary(userId: string): Promise<UserPermissionSummary> {
    const permissions = await this.getUserPermissions(userId);
    const permissionMap = new Map<string, CatPermission>();

    for (const perm of permissions) {
      permissionMap.set(`${perm.category}:${perm.action_id}`, perm);
    }

    const categories = Object.entries(ACTION_CATEGORIES).map(([cat, meta]) => {
      const category = cat as ActionCategory;
      const actionsInCategory = Object.values(CAT_ACTIONS).filter(
        a => a.category === category && a.enabled
      );

      // Check if category is enabled (either specific category grant or all actions granted)
      const categoryPerm = permissionMap.get(`${category}:*`);
      const categoryEnabled = categoryPerm?.granted ?? DEFAULT_PERMISSIONS[category] ?? false;

      // Count enabled actions
      let enabledCount = 0;
      if (categoryEnabled) {
        enabledCount = actionsInCategory.length;
      } else {
        for (const action of actionsInCategory) {
          const actionPerm = permissionMap.get(`${category}:${action.id}`);
          if (actionPerm?.granted) {
            enabledCount++;
          }
        }
      }

      return {
        category,
        name: meta.name,
        description: meta.description,
        enabled: categoryEnabled || enabledCount > 0,
        actionCount: actionsInCategory.length,
        enabledActionCount: categoryEnabled ? actionsInCategory.length : enabledCount,
      };
    });

    const totalActions = Object.values(CAT_ACTIONS).filter(a => a.enabled).length;
    const enabledActions = categories.reduce((sum, c) => sum + c.enabledActionCount, 0);

    // Check if any high-risk actions are enabled
    const highRiskActions = Object.values(CAT_ACTIONS).filter(
      a => a.riskLevel === 'high' && a.enabled
    );
    let highRiskEnabled = false;
    for (const action of highRiskActions) {
      const perm = await this.checkPermission(userId, action.id);
      if (perm.allowed) {
        highRiskEnabled = true;
        break;
      }
    }

    return {
      categories,
      totalActions,
      enabledActions,
      highRiskEnabled,
    };
  }

  /**
   * Initialize default permissions for a new user
   */
  async initializeDefaults(userId: string): Promise<void> {
    for (const [category, enabled] of Object.entries(DEFAULT_PERMISSIONS)) {
      if (enabled) {
        await this.grantCategory(userId, category as ActionCategory, {
          requiresConfirmation: true,
        });
      }
    }
  }
}

export function createPermissionService(supabase: AnySupabaseClient): CatPermissionService {
  return new CatPermissionService(supabase);
}
