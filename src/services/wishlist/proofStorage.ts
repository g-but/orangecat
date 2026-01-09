/**
 * Proof Storage Service
 * Handles proof image uploads (receipts, screenshots) to Supabase storage
 *
 * Created: 2026-01-09
 * Last Modified: 2026-01-09
 * Last Modified Summary: Created to handle wishlist proof image uploads
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';

export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class ProofStorageService {
  private static readonly BUCKET_NAME = 'proofs';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for proof images
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  /**
   * Upload proof image (receipt or screenshot)
   * @param wishlistItemId - The wishlist item this proof belongs to
   * @param file - The image file to upload
   * @param proofType - Type of proof (receipt, screenshot)
   * @param onProgress - Optional progress callback
   */
  static async uploadProofImage(
    wishlistItemId: string,
    file: File,
    proofType: 'receipt' | 'screenshot',
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResult> {
    return this.uploadFile(file, `${wishlistItemId}/${proofType}`, proofType, onProgress);
  }

  /**
   * Generic file upload method
   */
  private static async uploadFile(
    file: File,
    path: string,
    type: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate unique filename with timestamp to avoid collisions
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${path}_${Date.now()}.${fileExt}`;

      // Start progress simulation for UX feedback
      let progressInterval: NodeJS.Timeout | null = null;
      if (onProgress) {
        let progress = 0;
        progressInterval = setInterval(() => {
          progress += 15;
          onProgress({
            loaded: (progress / 100) * file.size,
            total: file.size,
            percentage: Math.min(progress, 85),
          });
          if (progress >= 85 && progressInterval) {
            clearInterval(progressInterval);
          }
        }, 100);
      }

      // Upload to Supabase Storage
      const { error } = await supabase.storage.from(this.BUCKET_NAME).upload(fileName, file, {
        cacheControl: '31536000', // 1 year cache
        upsert: false, // Don't overwrite - each proof is unique
      });

      // Clear progress interval
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      if (error) {
        logger.error(`Failed to upload proof ${type}`, { error, fileName });
        return {
          success: false,
          error: error.message || `Failed to upload ${type}`,
        };
      }

      // Complete progress
      if (onProgress) {
        onProgress({
          loaded: file.size,
          total: file.size,
          percentage: 100,
        });
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(fileName);

      logger.info(`Successfully uploaded proof ${type}`, {
        fileName,
        url: publicUrl,
      });

      return {
        success: true,
        url: publicUrl,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error uploading proof ${type}`, { error: message });
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file exists
    if (!file) {
      return {
        valid: false,
        error: 'No file provided',
      };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size must be less than ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type must be one of: JPEG, PNG, WebP, or GIF`,
      };
    }

    return { valid: true };
  }

  /**
   * Delete a proof file from storage
   */
  static async deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);

      if (error) {
        logger.error('Failed to delete proof file', { error, filePath });
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info('Successfully deleted proof file', { filePath });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error deleting proof file', { error: message, filePath });
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Extract file path from public URL for deletion
   */
  static extractFilePathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/storage/v1/object/public/proofs/');
      return pathParts.length > 1 ? pathParts[1] : null;
    } catch {
      return null;
    }
  }
}

export default ProofStorageService;
