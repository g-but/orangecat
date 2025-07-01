/**
 * Campaign Storage Service
 * Handles campaign media uploads to Supabase storage
 * 
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Initial creation for Option A - Campaign Creation Modernization
 */

import { supabase } from '@/services/supabase/client'
import { toast } from 'sonner'

export interface FileUploadResult {
  success: boolean
  url?: string
  error?: string
}

export interface FileUploadProgress {
  loaded: number
  total: number
  percentage: number
}

export class CampaignStorageService {
  private static readonly BUCKET_NAME = 'campaigns'
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB for campaign media
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  /**
   * Upload campaign banner image
   */
  static async uploadBanner(
    campaignId: string,
    file: File,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResult> {
    return this.uploadFile(file, `${campaignId}/banner`, 'banner', onProgress)
  }

  /**
   * Upload campaign gallery image
   */
  static async uploadGalleryImage(
    campaignId: string,
    file: File,
    imageIndex: number,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResult> {
    return this.uploadFile(file, `${campaignId}/gallery/${imageIndex}`, 'gallery image', onProgress)
  }

  /**
   * Upload campaign logo/avatar
   */
  static async uploadLogo(
    campaignId: string,
    file: File,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResult> {
    return this.uploadFile(file, `${campaignId}/logo`, 'logo', onProgress)
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
      const validation = this.validateFile(file)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${path}_${Date.now()}.${fileExt}`

      // Simulate progress for small files
      if (onProgress) {
        const simulateProgress = () => {
          let progress = 0
          const interval = setInterval(() => {
            progress += 20
            onProgress({
              loaded: (progress / 100) * file.size,
              total: file.size,
              percentage: Math.min(progress, 90)
            })
            if (progress >= 90) clearInterval(interval)
          }, 100)
        }
        simulateProgress()
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        return { success: false, error: `Failed to upload ${type}: ${error.message}` }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName)

      // Complete progress
      if (onProgress) {
        onProgress({
          loaded: file.size,
          total: file.size,
          percentage: 100
        })
      }

      return {
        success: true,
        url: urlData.publicUrl
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to upload ${type}`
      }
    }
  }

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Please upload: ${this.ALLOWED_TYPES.map(t => t.split('/')[1]).join(', ')}`
      }
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      }
    }

    return { valid: true }
  }

  /**
   * Delete campaign media file
   */
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath])

      if (error) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  static getOptimizedImageUrl(
    originalUrl: string,
    options: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'jpeg' | 'png'
    } = {}
  ): string {
    // For now, return the original URL
    // In future, could integrate with image optimization service
    return originalUrl
  }
}

export default CampaignStorageService 