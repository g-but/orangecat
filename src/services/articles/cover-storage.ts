/**
 * Article cover upload — thin wrapper over the shared user-image upload
 * (src/services/images/upload.ts), kept for its existing import surface.
 * Returns a public URL to store in `metadata.article.cover_image`.
 */

import { uploadUserImage } from '@/services/images/upload';
import type { FileUploadResult } from '@/types/storage';

export {
  IMAGE_UPLOAD_ACCEPT as COVER_ACCEPT,
  IMAGE_UPLOAD_MAX_MB as COVER_MAX_MB,
  validateImageFile as validateCoverFile,
} from '@/services/images/upload';

export function uploadArticleCover(userId: string, file: File): Promise<FileUploadResult> {
  return uploadUserImage(userId, file, 'article-cover');
}
