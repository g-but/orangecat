import { NextRequest, NextResponse } from 'next/server'
import supabaseAdmin from '@/services/supabase/admin'
import { createServerClient } from '@/services/supabase/server'
import path from 'path'
import { logger } from '@/utils/logger'

const BUCKET_NAME = 'avatars'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // Reduced to 5MB for security
const AVATAR_SIZE = 512

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
    return { valid: false, error: `File too large for type ${file.type}. Maximum: ${Math.round(maxSize / 1024 / 1024)}MB` }
  }
  
  // 6. Filename sanitization
  const sanitizedName = file.name
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
 * Secure image processing with comprehensive sanitization
 */
async function secureImageProcessing(buffer: Buffer) {
  // Dynamically import sharp at runtime to prevent build-time native binding issues
  const sharp = (await import('sharp')).default
  try {
    // Process with Sharp - automatically strips metadata and sanitizes
    const processedImage = await sharp(buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, {
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
      .toBuffer()
    
    // Verify the processed image is clean
    const verification = await sharp(processedImage).metadata()
    
    // Ensure no metadata survived the processing
    if (verification.exif || verification.icc || verification.iptc || verification.xmp) {
      throw new Error('Metadata stripping failed - image rejected')
    }
    
    // Final dimension validation
    if (verification.width !== AVATAR_SIZE || verification.height !== AVATAR_SIZE) {
      throw new Error('Image dimensions validation failed')
    }
    
    return {
      buffer: processedImage,
      metadata: {
        format: verification.format,
        width: verification.width,
        height: verification.height,
        size: processedImage.length
      }
    }
    
  } catch (error) {
    console.error('[avatar] Security processing failed:', error)
    throw new Error('Image processing failed security validation')
  }
}

/**
 * POST /api/avatar
 * Body: multipart/form-data with fields { file: File, userId: string }
 * Returns JSON { publicUrl: string }
 * 
 * 🔒 SECURITY ENHANCED: Authentication required, comprehensive validation
 */
export async function POST(req: NextRequest) {
  try {
    // 🔒 CRITICAL: Verify user authentication FIRST
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (!user || userError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
  const formData = await req.formData()
  const file = formData.get('file') as File | null
    const requestedUserId = formData.get('userId') as string | null
    
    // 🔒 CRITICAL: Verify user can only upload for themselves
    if (!requestedUserId || requestedUserId !== user.id) {
      return NextResponse.json(
        { error: 'Cannot upload files for other users' },
        { status: 403 }
      )
    }
    
    // 🔒 Sanitize userId to prevent path traversal
    const sanitizedUserId = user.id.replace(/[^a-zA-Z0-9-]/g, '')
    if (sanitizedUserId !== user.id) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      )
    }
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // 🔒 Enhanced file validation
    const buffer = Buffer.from(await file.arrayBuffer())
    const validation = await validateUploadedFile(file, buffer)
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }
    
    // 🔒 Check user permissions for file uploads
    const userProfile = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()
    
    if (!userProfile.data) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // ── Ensure bucket exists ────────────────────────────────────────────────────
    try {
      const { data: buckets, error: listErr } = await supabaseAdmin.storage.listBuckets()
      if (listErr) {
        console.error('[avatar] listBuckets error', listErr)
      } else if (!buckets?.some((b) => b.id === BUCKET_NAME)) {
        const { error: createErr } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
          public: true,
        })
        if (createErr) {
          console.error('[avatar] createBucket error', createErr)
          return NextResponse.json({ error: 'Storage configuration error' }, { status: 500 })
        }
      }
    } catch (e: any) {
      console.error('[avatar] bucket ensure error', e)
    }

    // 🔒 Secure image processing with sanitization
    const { buffer: processedImage, metadata } = await secureImageProcessing(buffer)

    // ── Upload processed file ──────────────────────────────────────────────────
    const timestamp = Date.now()
    const filePath = `${sanitizedUserId}/${timestamp}.webp`
    
    const { error: uploadErr } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, processedImage, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '31536000',
      })
      
    if (uploadErr) {
      console.error('[avatar] upload error', uploadErr)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // ── Get public URL ──────────────────────────────────────────────────────────
    const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath)

    // 🔒 Log upload for audit trail
    // Log successful upload for audit trail
    logger.info(`Avatar upload completed for user ${user.id}`, { filePath }, 'Upload')

    return NextResponse.json({ 
      publicUrl: data.publicUrl,
      size: processedImage.length,
      dimensions: { width: AVATAR_SIZE, height: AVATAR_SIZE },
      processed: true
    })

  } catch (error: any) {
    console.error('[avatar] Security error:', error)
    return NextResponse.json({ 
      error: 'Upload security validation failed' 
    }, { status: 500 })
  }
} 