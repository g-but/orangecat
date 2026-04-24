import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';
import type { ActionHandler } from './types';

export const contextHandlers: Record<string, ActionHandler> = {
  add_context: async (supabase, _userId, actorId, params) => {
    const { data, error } = await supabase
      .from(ENTITY_REGISTRY.document.tableName)
      .insert({
        actor_id: actorId,
        title: params.title,
        content: params.content,
        document_type: params.document_type || 'notes',
        visibility: 'cat_visible',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: { ...data, displayMessage: `🧠 Saved to your Cat context: "${params.title}"` } };
  },

  update_profile: async (supabase, userId, _actorId, params) => {
    // Update the user's public profile. Only safe text fields — no username (affects URLs),
    // no email, no financial addresses. Profile.id = auth.users.id = userId.
    const SAFE_FIELDS = ['name', 'bio', 'background', 'website', 'location_city', 'location_country'] as const;
    type SafeField = typeof SAFE_FIELDS[number];

    const updates: Partial<Record<SafeField, string>> = {};
    for (const field of SAFE_FIELDS) {
      if (params[field] !== undefined && params[field] !== null) {
        updates[field] = params[field] as string;
      }
    }

    if (Object.keys(updates).length === 0) {
      return { success: false, error: 'No profile fields to update — provide at least one of: name, bio, background, website, location_city, location_country' };
    }

    const { data, error } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('name, bio, background, website, location_city, location_country')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const updatedFields = Object.keys(updates).join(', ');
    return {
      success: true,
      data: {
        ...data,
        displayMessage: `✅ Profile updated: ${updatedFields}`,
      },
    };
  },
};
