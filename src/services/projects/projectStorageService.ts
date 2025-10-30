/**
 * Project Storage Service
 * Handles project media uploads (banners, gallery images) to Supabase storage
 *
 * Created: 2025-10-30
 * Last Modified: 2025-10-30
 * Last Modified Summary: Created to fix missing import causing 500 errors
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

export class CampaignStorageService {
  private static readonly BUCKET_NAME = 'projects';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for project images
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  /**
   * Upload project banner image
   */
  static async uploadBanner(
    projectId: string,
    file: File,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResult> {
    return this.uploadFile(file, `${projectId}/banner`, 'banner', onProgress);
  }

  /**
   * Upload project gallery image
   */
  static async uploadGalleryImage(
    projectId: string,
    file: File,
    index: number,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResult> {
    return this.uploadFile(file, `${projectId}/gallery/${index}`, 'gallery image', onProgress);
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

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}_${Date.now()}.${fileExt}`;

      // Simulate progress for small files
      if (onProgress) {
        const simulateProgress = () => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += 20;
            onProgress({
              loaded: (progress / 100) * file.size,
              total: file.size,
              percentage: Math.min(progress, 90),
            });
            if (progress >= 90) {
              clearInterval(interval);
            }
          }, 100);
        };
        simulateProgress();
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage.from(this.BUCKET_NAME).upload(fileName, file, {
        cacheControl: '31536000', // 1 year
        upsert: true, // Replace if exists
      });

      if (error) {
        logger.error(`Failed to upload ${type}`, { error, fileName });
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

      logger.info(`Successfully uploaded ${type}`, { fileName, url: publicUrl });

      return {
        success: true,
        url: publicUrl,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error uploading ${type}`, { error: message });
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
        error: `File type must be one of: ${this.ALLOWED_TYPES.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);

      if (error) {
        logger.error('Failed to delete file', { error, filePath });
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info('Successfully deleted file', { filePath });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error deleting file', { error: message, filePath });
      return {
        success: false,
        error: message,
      };
    }
  }
}

export default CampaignStorageService;
