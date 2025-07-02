/**
 * Profile Storage Service
 * Handles avatar and banner uploads to Supabase storage
 * 
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Initial creation for Option A - Profile Backend Integration
 */

import supabase from '@/services/supabase/client'
import { toast } from 'sonner'
import { logger } from '@/utils/logger'
import type { CatchError } from '@/types/common'
import { getErrorMessage } from '@/types/common'

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

export class ProfileStorageService {
  private static readonly BUCKET_NAME = 'profiles'
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

  /**
   * Upload avatar image for user
   */
  static async uploadAvatar(
    userId: string, 
    file: File,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResult> {
    return this.uploadFile(userId, file, 'avatar', onProgress)
  }

  /**
   * Upload banner image for user
   */
  static async uploadBanner(
    userId: string, 
    file: File,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResult> {
    return this.uploadFile(userId, file, 'banner', onProgress)
  }

  /**
   * Generic file upload method
   */
  private static async uploadFile(
    userId: string,
    file: File,
    type: 'avatar' | 'banner',
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Generate unique filename
      const timestamp = Date.now()
      const extension = file.name.split('.').pop()
      const fileName = `${userId}/${type}_${timestamp}.${extension}`

      // Create progress tracking
      if (onProgress) {
        onProgress({ loaded: 0, total: file.size, percentage: 0 })
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '31536000', // 1 year cache
          upsert: true, // Replace if exists
        })

      if (error) {
        return { success: false, error: 'Failed to upload file' }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName)

      // Complete progress
      if (onProgress) {
        onProgress({ loaded: file.size, total: file.size, percentage: 100 })
      }

      return { success: true, url: publicUrl }

    } catch (error) {
      return { success: false, error: 'Upload failed' }
    }
  }

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Please upload a valid image file (JPEG, PNG, WebP, or AVIF)'
      }
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'File size must be less than 5MB'
      }
    }

    return { valid: true }
  }

  /**
   * Delete old profile image
   */
  static async deleteProfileImage(userId: string, type: 'avatar' | 'banner'): Promise<boolean> {
    try {
      // List files for this user and type
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(`${userId}/`, {
          search: `${type}_`
        })

      if (error || !data) {
        return false
      }

      // Delete all matching files
      const filesToDelete = data.map(file => `${userId}/${file.name}`)
      
      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .remove(filesToDelete)

        if (deleteError) {
          return false
        }
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get current profile images for user
   */
  static async getUserProfileImages(userId: string): Promise<{
    avatar?: string
    banner?: string
  }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(`${userId}/`)

      if (error || !data) {
        return {}
      }

      const result: { avatar?: string; banner?: string } = {}

      // Find latest avatar and banner
      const avatarFiles = data.filter(f => f.name.startsWith('avatar_')).sort((a, b) => b.name.localeCompare(a.name))
      const bannerFiles = data.filter(f => f.name.startsWith('banner_')).sort((a, b) => b.name.localeCompare(a.name))

      if (avatarFiles.length > 0) {
        const { data: { publicUrl } } = supabase.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(`${userId}/${avatarFiles[0].name}`)
        result.avatar = publicUrl
      }

      if (bannerFiles.length > 0) {
        const { data: { publicUrl } } = supabase.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(`${userId}/${bannerFiles[0].name}`)
        result.banner = publicUrl
      }

      return result
    } catch (error) {
      return {}
    }
  }
}

export default ProfileStorageService 