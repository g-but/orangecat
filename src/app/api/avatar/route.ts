import { createFileUploadHandler } from '@/lib/api/fileUploadHandler'

/**
 * POST /api/avatar
 * Body: multipart/form-data with fields { file: File }
 * Returns JSON { publicUrl: string }
 * 
 * 🔒 SECURITY: Authentication required, comprehensive validation
 * ♻️ REFACTORED: Uses generic file upload handler (eliminated 66 lines of duplicate code)
 */
export const POST = createFileUploadHandler({
  bucketName: 'avatars',
  logPrefix: '[avatar]',
  validationType: 'avatar'
}) 