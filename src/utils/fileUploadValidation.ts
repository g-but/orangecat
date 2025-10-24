/**
 * CENTRALIZED FILE UPLOAD VALIDATION
 * 
 * Created: 2025-01-09
 * Purpose: Eliminate 600+ lines of duplicate validation code across avatar/banner routes
 * 
 * Consolidates:
 * - src/app/api/avatar/route.ts (duplicate validation)
 * - src/app/api/banner/route.ts (duplicate validation)
 * - Campaign storage validation
 * - Profile storage validation
 */

import path from 'path'
import sharp from 'sharp'

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

export interface FileValidationResult {
  valid: boolean
  error?: string
  sanitizedName?: string
  detectedType?: string
}

export interface FileUploadConfig {
  maxSize: number
  allowedExtensions: readonly string[]
  allowedMimeTypes: readonly string[]
  dimensions: {
    width: number
    height: number
  }
}

export const UPLOAD_CONFIGS = {
  avatar: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    dimensions: { width: 400, height: 400 }
  },
  banner: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    dimensions: { width: 1200, height: 400 }
  },
  project: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    dimensions: { width: 1200, height: 600 }
  }
} as const

export class FileUploadValidator {
  /**
   * Comprehensive file validation with security layers
   */
  static async validateFile(
    file: File, 
    buffer: Buffer, 
    config: FileUploadConfig
  ): Promise<FileValidationResult> {
    // 1. File extension validation
    const fileExtension = path.extname(file.name).toLowerCase()
    
    if (!(config.allowedExtensions as string[]).includes(fileExtension)) {
      return { valid: false, error: 'Invalid file extension' }
    }
    
    // 2. MIME type validation with strict checking
    if (!(config.allowedMimeTypes as string[]).includes(file.type)) {
      return { valid: false, error: 'MIME type does not match allowed types' }
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
    
    // 5. File size validation
    if (file.size > config.maxSize) {
      return { valid: false, error: `File too large. Maximum size: ${config.maxSize / 1024 / 1024}MB` }
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
   * Secure image processing with Sharp
   */
  static async processImage(
    buffer: Buffer, 
    config: FileUploadConfig,
    format: 'webp' | 'jpeg' = 'webp'
  ): Promise<{ buffer: Buffer; metadata: any }> {
    try {
      const processed = await sharp(buffer)
        .resize(config.dimensions.width, config.dimensions.height, {
          fit: 'cover',
          position: 'center'
        })
        .toFormat(format, { quality: 85 })
        .toBuffer({ resolveWithObject: true })

      return {
        buffer: processed.data,
        metadata: processed.info
      }
    } catch (error) {
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get upload configuration by type
   */
  static getConfig(type: keyof typeof UPLOAD_CONFIGS): FileUploadConfig {
    return UPLOAD_CONFIGS[type]
  }
} 