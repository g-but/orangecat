import { NextRequest, NextResponse } from 'next/server'
import supabaseAdmin from '@/services/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/utils/logger'
import { FileUploadValidator } from '@/utils/fileUploadValidation'

/**
 * Generic File Upload Handler
 * 
 * Eliminates DRY violations by centralizing file upload logic.
 * Used by avatar, banner, and other file upload APIs.
 * 
 * 🔒 SECURITY: Authentication required, comprehensive validation
 * ♻️ REFACTORED: Eliminates 66 lines of duplicate code per API route
 */

export interface FileUploadConfig {
  bucketName: string
  logPrefix: string
  validationType: 'avatar' | 'banner' | 'document'
}

export async function createFileUploadHandler(config: FileUploadConfig) {
  return async function handleFileUpload(req: NextRequest): Promise<NextResponse> {
    try {
      // Authentication
      const supabase = await createServerClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (!user || authError) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      // ── Centralized File Validation ──────────────────────────────────────────────
      const buffer = Buffer.from(await file.arrayBuffer())
      const validationConfig = FileUploadValidator.getConfig(config.validationType)
      const validation = await FileUploadValidator.validateFile(file, buffer, validationConfig)
      
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      // ── Secure Image Processing ──────────────────────────────────────────────
      const processedResult = await FileUploadValidator.processImage(buffer, validationConfig, 'webp')
      const processedImage = processedResult.buffer

      // ── Generate Secure File Path ──────────────────────────────────────────────
      const timestamp = Date.now()
      const sanitizedUserId = user.id.replace(/[^a-zA-Z0-9-]/g, '')
      const filePath = `${sanitizedUserId}/${timestamp}.webp`

      // ── Upload to Supabase Storage ──────────────────────────────────────────────
      const { error: uploadError } = await supabaseAdmin.storage
        .from(config.bucketName)
        .upload(filePath, processedImage, {
          contentType: 'image/webp',
          upsert: true,
          cacheControl: '3600'
        })

      if (uploadError) {
        logger.error(`${config.logPrefix} Upload failed:`, { error: uploadError.message }, 'Upload')
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
      }

      // ── Get public URL ──────────────────────────────────────────────────────────
      const { data } = supabaseAdmin.storage.from(config.bucketName).getPublicUrl(filePath)

      logger.info(`${config.logPrefix} upload completed for user ${user.id}`, { filePath }, 'Upload')

      return NextResponse.json({ 
        publicUrl: data.publicUrl,
        size: processedImage.length,
        dimensions: validationConfig.dimensions,
        processed: true,
        securityValidated: true
      })

    } catch (error: any) {
      logger.error(`${config.logPrefix} Upload error:`, { error: error.message }, 'Security')
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
  }
}