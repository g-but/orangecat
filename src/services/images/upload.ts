/**
 * Generic user-image upload to the public BANNERS bucket under `${userId}/…`
 * — the same convention avatars/banners/article covers already use, so no new
 * bucket or policy. Shared by article covers and the post-image Upload tab.
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { STORAGE_BUCKETS } from '@/config/database-tables';
import type { FileUploadResult } from '@/types/storage';

const BUCKET = STORAGE_BUCKETS.BANNERS;
// Must not exceed the banners bucket's server-side file_size_limit (5MB) — a
// larger file passes this check then fails at the bucket with a cryptic error.
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export const IMAGE_UPLOAD_ACCEPT = ALLOWED_TYPES.join(',');
export const IMAGE_UPLOAD_MAX_MB = MAX_SIZE / 1024 / 1024;

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please choose a JPEG, PNG, WebP, or GIF image.' };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: `Image must be under ${IMAGE_UPLOAD_MAX_MB}MB.` };
  }
  return { valid: true };
}

export async function uploadUserImage(
  userId: string,
  file: File,
  prefix: string
): Promise<FileUploadResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const ext = file.name.split('.').pop() || 'jpg';
    // userId first segment namespaces each user's uploads (same convention as
    // avatars/banners). Timestamp keeps successive uploads from colliding.
    const fileName = `${userId}/${prefix}_${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
      cacheControl: '31536000',
      upsert: true,
    });
    if (error) {
      logger.error('Failed to upload image', { error: error.message, prefix }, 'Images');
      return { success: false, error: error.message || 'Upload failed. Please try again.' };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return { success: true, url: publicUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
    logger.error('Error uploading image', { message, prefix }, 'Images');
    return { success: false, error: message };
  }
}
