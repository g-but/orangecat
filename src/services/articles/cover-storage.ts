/**
 * Upload an article cover image. Reuses the public BANNERS bucket with a
 * `${userId}/…` path — a cover is a banner-class hero image, and the userId
 * prefix matches the bucket's existing owner-scoped RLS, so no new bucket or
 * storage-policy change is needed. Returns a public URL to store in
 * `metadata.article.cover_image`.
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { STORAGE_BUCKETS } from '@/config/database-tables';
import type { FileUploadResult } from '@/types/storage';

const BUCKET = STORAGE_BUCKETS.BANNERS;
const MAX_SIZE = 8 * 1024 * 1024; // 8MB — covers are large hero images
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export const COVER_ACCEPT = ALLOWED_TYPES.join(',');
export const COVER_MAX_MB = MAX_SIZE / 1024 / 1024;

export function validateCoverFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please choose a JPEG, PNG, WebP, or GIF image.' };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: `Image must be under ${COVER_MAX_MB}MB.` };
  }
  return { valid: true };
}

export async function uploadArticleCover(userId: string, file: File): Promise<FileUploadResult> {
  const validation = validateCoverFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const ext = file.name.split('.').pop() || 'jpg';
    // userId first segment → satisfies the bucket's owner-scoped RLS.
    const fileName = `${userId}/article-cover_${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
      cacheControl: '31536000',
      upsert: true,
    });
    if (error) {
      logger.error('Failed to upload article cover', { error: error.message }, 'Articles');
      return { success: false, error: error.message || 'Upload failed. Please try again.' };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return { success: true, url: publicUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
    logger.error('Error uploading article cover', { message }, 'Articles');
    return { success: false, error: message };
  }
}
