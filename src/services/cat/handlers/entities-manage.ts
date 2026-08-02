/**
 * Entity MANAGE handlers — update, publish, archive an existing entity.
 *
 * Split from entities.ts (500-line service limit); creation lives in
 * entities-create.ts. Both are re-exported by entities.ts as one map.
 */

import { ENTITY_REGISTRY, isValidEntityType } from '@/config/entity-registry';
import { ENTITY_STATUS } from '@/config/database-constants';
import { resolvePublishStatus } from '@/config/entity-status';
import type { ActionHandler } from './types';

export const entityManageHandlers: Record<string, ActionHandler> = {
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

    const publishStatus = isValidEntityType(entityType)
      ? resolvePublishStatus(entityType, ENTITY_STATUS.ACTIVE)
      : ENTITY_STATUS.ACTIVE;

    const { data, error } = await supabase
      .from(meta.tableName)
      .update({ status: publishStatus })
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
      .update({ status: ENTITY_STATUS.ARCHIVED })
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
