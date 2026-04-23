/**
 * Document Text Extraction API
 *
 * POST /api/documents/extract - Extract text from uploaded files
 * Supports .txt, .md files natively. PDF/DOCX show helpful message.
 */

import { apiSuccess, apiValidationError, apiRateLimited, handleApiError } from '@/lib/api/standardResponse';
import {  rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { generateTitle, detectDocumentType } from '@/services/documents/textExtractor';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.txt', '.md', '.markdown', '.text'];
const PDF_DOCX_EXTENSIONS = ['.pdf', '.doc', '.docx'];

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {return apiRateLimited('Too many extraction requests. Please slow down.', retryAfterSeconds(rl));}

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {return apiValidationError('No file provided');}

    const fileName = file.name;
    const extension = '.' + fileName.split('.').pop()?.toLowerCase();

    if (file.size > MAX_FILE_SIZE) {return apiValidationError(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);}

    if (PDF_DOCX_EXTENSIONS.includes(extension)) {
      return apiValidationError(`${extension.toUpperCase()} files are not yet supported. Please copy and paste the text content, or convert to .txt first. We're working on adding support for more file types!`);
    }

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return apiValidationError(`Unsupported file type "${extension}". Supported types: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    let content: string;
    try {
      content = await file.text();
    } catch {
      return apiValidationError('Could not read file content. Please ensure it is a valid text file.');
    }

    content = content.trim();
    if (!content) {return apiValidationError('File is empty. Please upload a file with content.');}
    if (content.length > 50000) {content = content.substring(0, 50000);}

    return apiSuccess({
      title: generateTitle(fileName),
      content,
      fileType: extension,
      documentType: detectDocumentType(content, fileName),
      characterCount: content.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
