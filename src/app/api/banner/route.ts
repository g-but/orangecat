import { NextRequest, NextResponse } from 'next/server'
import supabaseAdmin from '@/services/supabase/admin'
import { createServerClient } from '@/services/supabase/server'
import path from 'path'
import { logger } from '@/utils/logger'
import { SecurityHardening, SecurityMonitor, XSSPrevention } from '@/services/security/security-hardening'
import sharp from 'sharp'

const BUCKET_NAME = 'banners'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // Reduced to 5MB for security
const BANNER_WIDTH = 1200
const BANNER_HEIGHT = 400

// File type validation with magic bytes
const MAGIC_BYTES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46]
}

// Suspicious content patterns to scan for
const SUSPICIOUS_PATTERNS = [
  /<\?php/gi,           // PHP code
  /<script/gi,          // JavaScript
  /<%/gi,               // JSP/ASP code
  /\.exe\b/gi,          // Executable references
  /\.dll\b/gi,          // DLL references
  /javascript:/gi,      // JavaScript protocol
  /vbscript:/gi         // VBScript protocol
]

/**
 * Enhanced file validation with multiple security layers
 */
async function validateUploadedFile(file: File, buffer: Buffer) {
  // 1. File extension validation
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  const fileExtension = path.extname(file.name).toLowerCase()
  
  if (!allowedExtensions.includes(fileExtension)) {
    return { valid: false, error: 'Invalid file extension' }
  }
  
  // 2. MIME type validation with strict checking
  const trustedMimeTypes: { [key: string]: string[] } = {
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.png': ['image/png'],
    '.webp': ['image/webp'],
    '.gif': ['image/gif']
  }
  
  if (!trustedMimeTypes[fileExtension]?.includes(file.type)) {
    return { valid: false, error: 'MIME type does not match file extension' }
  }
  
  // 3. Magic byte validation (file signature)
  const signature = MAGIC_BYTES[file.type as keyof typeof MAGIC_BYTES]
  if (signature) {
    const fileHeader = Array.from(buffer.slice(0, signature.length))
    const signatureMatch = signature.every((byte, index) => fileHeader[index] === byte)
    if (!signatureMatch) {
      return { valid: false, error: 'File signature does not match declared type' }
    }
  }
  
  // 4. Content scanning for embedded threats
  const fileContent = buffer.toString('utf8', 0, Math.min(buffer.length, 10000)) // Scan first 10KB
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(fileContent)) {
      return { valid: false, error: 'Suspicious content detected in file' }
    }
  }
  
  // 5. File size validation (with type-specific limits)
  const maxSizes: { [key: string]: number } = {
    'image/jpeg': 5 * 1024 * 1024,  // 5MB for JPEG
    'image/png': 3 * 1024 * 1024,   // 3MB for PNG
    'image/webp': 2 * 1024 * 1024,  // 2MB for WebP
    'image/gif': 1 * 1024 * 1024    // 1MB for GIF
  }
  
  const maxSize = maxSizes[file.type] || 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: `File too large for type ${file.type}` }
  }
  
  // 6. Filename sanitization
  const sanitizedName = XSSPrevention.sanitizeForAttribute(file.name)
    .replace(/[^a-zA-Z0-9.-]/g, '_')  // Replace special chars
    .replace(/\.{2,}/g, '.')         // Prevent path traversal
    .substring(0, 100)               // Limit length
  
  return { 
    valid: true, 
    sanitizedName,
    detectedType: file.type 
  }
}

/**
 * Secure image processing with metadata stripping
 */
async function secureImageProcessing(buffer: Buffer, file: File) {
  try {
    // Strip ALL metadata for privacy and security
    let processedImage = sharp(buffer)
      .withMetadata(false)  // Remove all metadata
      .flatten({            // Flatten to prevent layer exploits
        background: { r: 255, g: 255, b: 255 }
      })
      .resize({
        width: BANNER_WIDTH,
        height: BANNER_HEIGHT,
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true,  // Prevent enlargement attacks
        fastShrinkOnLoad: false    // More secure processing
      })
      .webp({
        quality: 85,
        effort: 6,
        nearLossless: false  // Prevent lossless metadata preservation
      })

    const result = await processedImage.toBuffer()
    
    // Verify the processed image is clean
    const verification = await sharp(result).metadata()
    
    // Ensure no metadata survived the processing
    if (verification.exif || verification.icc || verification.iptc || verification.xmp) {
      throw new Error('Metadata stripping failed - image rejected')
    }
    
    return {
      buffer: result,
      metadata: {
        format: verification.format,
        width: verification.width,
        height: verification.height,
        size: result.length,
        stripped: true
      }
    }
    
  } catch (error) {
    logger.error('[banner] Security processing failed:', error, 'Security')
    throw new Error('Image processing failed security validation')
  }
}

/**
 * POST /api/banner
 * Body: multipart/form-data with fields { file: File }
 * Returns JSON { publicUrl: string }
 * 
 * 🔒 SECURITY ENHANCED: Authentication required, comprehensive validation
 */
export async function POST(req: NextRequest) {
  try {
    // 🔒 APPLY COMPREHENSIVE SECURITY
    const securityResult = await SecurityHardening.secureAPIRoute(req, {
      requireAuth: true,
      rateLimit: 'upload',
      allowedMethods: ['POST']
    })

    if (!securityResult.success) {
      return securityResult.response
    }

    const user = securityResult.user!
    
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    
    // 🔒 CRITICAL: No userId parameter - use authenticated user only
    if (!file) {
      SecurityMonitor.recordEvent('upload_no_file', 'medium', {
        userId: user.id
      })
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // ── Enhanced File Validation ──────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer())
    const validation = await validateUploadedFile(file, buffer)
    
    if (!validation.valid) {
      SecurityMonitor.recordEvent('upload_validation_failed', 'high', {
        userId: user.id,
        fileName: file.name,
        error: validation.error
      })
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // ── Secure Image Processing ──────────────────────────────────────────────
    const processedResult = await secureImageProcessing(buffer, file)
    const processedImage = processedResult.buffer

    // ── Generate Secure File Path ──────────────────────────────────────────────
    const timestamp = Date.now()
    const sanitizedUserId = user.id.replace(/[^a-zA-Z0-9-]/g, '') // Sanitize user ID
    const filePath = `${sanitizedUserId}/${timestamp}.webp`

    // ── Upload to Supabase Storage ──────────────────────────────────────────────
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, processedImage, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '3600'
      })

    if (uploadError) {
      logger.error('[banner] Upload failed:', uploadError, 'Upload')
      SecurityMonitor.recordEvent('upload_storage_failed', 'high', {
        userId: user.id,
        error: uploadError.message
      })
      return NextResponse.json(
        { error: 'Upload failed' },
        { status: 500 }
      )
    }

    // ── Get public URL ──────────────────────────────────────────────────────────
    const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath)

    // 🔒 Log upload for audit trail
    SecurityMonitor.recordEvent('banner_upload_success', 'low', {
      userId: user.id,
      filePath,
      fileSize: processedImage.length,
      originalSize: file.size,
      metadata: processedResult.metadata
    })

    logger.info(`Banner upload completed for user ${user.id}`, { filePath }, 'Upload')

    return NextResponse.json({ 
      publicUrl: data.publicUrl,
      size: processedImage.length,
      dimensions: { width: BANNER_WIDTH, height: BANNER_HEIGHT },
      processed: true,
      securityValidated: true
    })

  } catch (error: any) {
    SecurityMonitor.recordEvent('banner_upload_error', 'critical', {
      error: error.message
    })
    
    logger.error('[banner] Security error:', error, 'Security')
    return NextResponse.json({ 
      error: 'Upload security validation failed' 
    }, { status: 500 })
  }
} 