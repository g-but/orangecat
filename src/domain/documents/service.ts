/**
 * DOCUMENT DOMAIN SERVICE
 *
 * Business logic for user documents (My Cat context).
 * Documents provide personal context that My Cat can use to give personalized advice.
 *
 * Created: 2026-01-20
 * Last Modified: 2026-01-20
 * Last Modified Summary: Initial creation
 */

import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import type { DocumentFormData, DocumentVisibility, DocumentType } from '@/lib/validation';

export interface Document {
  id: string;
  actor_id: string;
  title: string;
  content: string | null;
  file_url: string | null;
  file_type: string | null;
  file_size_bytes: number | null;
  document_type: DocumentType;
  visibility: DocumentVisibility;
  tags: string[];
  summary: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get or create actor for user
 * Actors are required for documents but may not exist for all users
 */
async function getOrCreateUserActor(userId: string): Promise<{ id: string }> {
  const supabase = await createServerClient();
  const adminClient = createAdminClient();

  // First try to find existing actor
  const { data: existingActor, error: findError } = await supabase
    .from(DATABASE_TABLES.ACTORS)
    .select('id')
    .eq('user_id', userId)
    .eq('actor_type', 'user')
    .maybeSingle();

  if (existingActor) {
    return existingActor as { id: string };
  }

  if (findError && findError.code !== 'PGRST116') {
    logger.error('Error checking for existing actor', { error: findError.message, userId });
    throw findError;
  }

  // Actor doesn't exist - create one
  // First get user profile for display name
  interface ProfileData {
    username: string | null;
    name: string | null;
    avatar_url: string | null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileResult: any = await supabase
    .from(DATABASE_TABLES.PROFILES)
    .select('username, name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  const profile = profileResult.data as ProfileData | null;
  const profileError = profileResult.error;

  if (profileError) {
    logger.error('Failed to get profile for actor creation', {
      error: profileError?.message,
      userId,
    });
    throw profileError;
  }

  const displayName = profile?.name || profile?.username || 'User';
  const slug = profile?.username || null;

  // Create actor using admin client (bypasses RLS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newActor, error: createError } = await (
    adminClient.from(DATABASE_TABLES.ACTORS) as any
  )
    .insert({
      actor_type: 'user',
      user_id: userId,
      display_name: displayName,
      avatar_url: profile?.avatar_url || null,
      slug: slug,
    })
    .select('id')
    .single();

  if (createError) {
    logger.error('Failed to create actor for user', { error: createError.message, userId });
    // Throw the actual Supabase error to preserve error details
    throw createError;
  }

  logger.info('Created actor for user', { actorId: newActor.id, userId });
  return newActor as { id: string };
}

/**
 * List documents for a user with pagination
 */
export async function listDocumentsPage(
  limit: number,
  offset: number,
  userId?: string,
  filters?: {
    document_type?: DocumentType;
    visibility?: DocumentVisibility;
  }
) {
  const supabase = await createServerClient();

  let query = supabase.from('user_documents').select('*', { count: 'exact' });

  if (userId) {
    // Get actor for user
    const actor = await getOrCreateUserActor(userId);
    query = query.eq('actor_id', actor.id);
  }

  if (filters?.document_type) {
    query = query.eq('document_type', filters.document_type);
  }

  if (filters?.visibility) {
    query = query.eq('visibility', filters.visibility);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Failed to list documents', { error: error.message, userId });
    throw error;
  }

  return { items: (data || []) as Document[], total: count || 0 };
}

/**
 * Get a single document by ID
 */
export async function getDocument(id: string): Promise<Document | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.from('user_documents').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    logger.error('Failed to get document', { error: error.message, id });
    throw error;
  }

  return data as Document;
}

/**
 * Create a new document
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createDocument(userId: string, data: DocumentFormData): Promise<Document> {
  const supabase = await createServerClient();

  // Get or create actor for this user
  const actor = await getOrCreateUserActor(userId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: document, error } = await (supabase.from('user_documents') as any)
    .insert({
      actor_id: actor.id,
      title: data.title,
      content: data.content,
      document_type: data.document_type || 'notes',
      visibility: data.visibility || 'cat_visible',
      tags: data.tags || [],
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create document', {
      error,
      errorMessage: error.message,
      errorCode: error.code,
      userId,
      actorId: actor.id,
      data,
    });
    throw error;
  }

  return document as Document;
}

/**
 * Update a document
 */
export async function updateDocument(
  id: string,
  userId: string,
  data: Partial<DocumentFormData>
): Promise<Document> {
  const supabase = await createServerClient();

  // Verify the document belongs to this user's actor
  const actor = await getOrCreateUserActor(userId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: document, error } = await (supabase.from('user_documents') as any)
    .update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.document_type !== undefined && { document_type: data.document_type }),
      ...(data.visibility !== undefined && { visibility: data.visibility }),
      ...(data.tags !== undefined && { tags: data.tags }),
    })
    .eq('id', id)
    .eq('actor_id', actor.id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update document', {
      error,
      errorMessage: error.message,
      errorCode: error.code,
      id,
      userId,
      data,
    });
    throw error;
  }

  return document as Document;
}

/**
 * Delete a document
 */
export async function deleteDocument(id: string, userId: string): Promise<void> {
  const supabase = await createServerClient();

  // Verify the document belongs to this user's actor
  const actor = await getOrCreateUserActor(userId);

  const { error } = await supabase
    .from('user_documents')
    .delete()
    .eq('id', id)
    .eq('actor_id', actor.id);

  if (error) {
    logger.error('Failed to delete document', {
      error,
      errorMessage: error.message,
      errorCode: error.code,
      id,
      userId,
    });
    throw error;
  }
}

/**
 * Get documents that My Cat can access for a user
 * Returns documents with visibility 'cat_visible' or 'public'
 */
export async function getDocumentsForCat(userId: string): Promise<Document[]> {
  const supabase = await createServerClient();

  // Get actor for user
  const actor = await getOrCreateUserActor(userId);

  const { data, error } = await supabase
    .from('user_documents')
    .select('*')
    .eq('actor_id', actor.id)
    .in('visibility', ['cat_visible', 'public'])
    .order('document_type', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to get documents for cat', { error: error.message, userId });
    throw error;
  }

  return (data || []) as Document[];
}

/**
 * Get public documents for any user (by their actor ID)
 * Used when My Cat needs to reference another user's public context
 */
export async function getPublicDocumentsForActor(actorId: string): Promise<Document[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('user_documents')
    .select('*')
    .eq('actor_id', actorId)
    .eq('visibility', 'public')
    .order('document_type', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to get public documents for actor', { error: error.message, actorId });
    throw error;
  }

  return (data || []) as Document[];
}
