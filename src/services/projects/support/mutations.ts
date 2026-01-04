/**
 * Project Support Mutations
 *
 * Database mutations for project support write operations.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created project support mutation functions
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import type { ProjectSupport, SupportProjectRequest, SupportProjectResponse } from './types';
import { supportProjectSchema } from './validation';
import { getCurrentUserId } from './helpers';

/**
 * Create project support (donation, signature, message, or reaction)
 */
export async function createProjectSupport(
  projectId: string,
  request: SupportProjectRequest
): Promise<SupportProjectResponse> {
  try {
    // Validate request
    const validationResult = supportProjectSchema.safeParse(request);
    if (!validationResult.success) {
      return {
        success: false,
        error: `Validation failed: ${validationResult.error.errors.map((e) => e.message).join(', ')}`,
      };
    }

    const userId = await getCurrentUserId();

    // Build support data
    const supportData: any = {
      project_id: projectId,
      user_id: userId,
      support_type: request.support_type,
      is_anonymous: request.is_anonymous || false,
    };

    // Add type-specific fields
    if (request.support_type === 'bitcoin_donation') {
      supportData.amount_sats = request.amount_sats;
      supportData.transaction_hash = request.transaction_hash || null;
      supportData.lightning_invoice = request.lightning_invoice || null;
    } else if (request.support_type === 'signature') {
      supportData.display_name = request.display_name;
      supportData.message = request.message || null;
    } else if (request.support_type === 'message') {
      supportData.display_name = request.display_name || null;
      supportData.message = request.message;
    } else if (request.support_type === 'reaction') {
      supportData.reaction_emoji = request.reaction_emoji;
    }

    // If anonymous, don't store user_id
    if (supportData.is_anonymous) {
      supportData.user_id = null;
    }

    // Insert support
    const { data, error } = await supabase
      .from('project_support')
      .insert(supportData)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create project support', error, 'ProjectSupport');
      return {
        success: false,
        error: 'Failed to create support',
      };
    }

    // Stats will be updated automatically by trigger

    return {
      success: true,
      support: data as ProjectSupport,
    };
  } catch (error) {
    logger.error('Error creating project support', error, 'ProjectSupport');
    return {
      success: false,
      error: 'Internal error',
    };
  }
}

/**
 * Delete project support (user can delete their own support)
 */
export async function deleteProjectSupport(
  supportId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user owns this support
    const { data: support, error: fetchError } = await supabase
      .from('project_support')
      .select('user_id')
      .eq('id', supportId)
      .single();

    if (fetchError || !support) {
      return { success: false, error: 'Support not found' };
    }

    if (support.user_id !== userId) {
      return { success: false, error: 'Forbidden' };
    }

    // Delete support
    const { error: deleteError } = await supabase
      .from('project_support')
      .delete()
      .eq('id', supportId);

    if (deleteError) {
      logger.error('Failed to delete project support', deleteError, 'ProjectSupport');
      return { success: false, error: 'Failed to delete support' };
    }

    // Stats will be updated automatically by trigger

    return { success: true };
  } catch (error) {
    logger.error('Error deleting project support', error, 'ProjectSupport');
    return { success: false, error: 'Internal error' };
  }
}


