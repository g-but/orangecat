/**
 * Document Text Extraction API
 *
 * POST /api/documents/extract - Extract text from uploaded files
 * Supports .txt, .md files natively. PDF/DOCX show helpful message.
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { apiSuccess, apiValidationError, handleApiError } from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.txt', '.md', '.markdown', '.text'];
const PDF_DOCX_EXTENSIONS = ['.pdf', '.doc', '.docx'];

/**
 * Generate a title from filename
 */
function generateTitle(fileName: string): string {
  // Remove extension
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

  // Replace common separators with spaces
  const cleaned = nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to spaces
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter of each word
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Detect document type from content
 */
function detectDocumentType(content: string, fileName: string): string {
  const lowerContent = content.toLowerCase();
  const lowerName = fileName.toLowerCase();

  // Check filename hints
  if (lowerName.includes('goal') || lowerName.includes('objective')) {
    return 'goals';
  }
  if (lowerName.includes('skill') || lowerName.includes('resume') || lowerName.includes('cv')) {
    return 'skills';
  }
  if (
    lowerName.includes('finance') ||
    lowerName.includes('budget') ||
    lowerName.includes('money')
  ) {
    return 'finances';
  }
  if (
    lowerName.includes('business') ||
    lowerName.includes('plan') ||
    lowerName.includes('startup')
  ) {
    return 'business_plan';
  }

  // Check content hints
  if (
    lowerContent.includes('my goal') ||
    lowerContent.includes('objective') ||
    lowerContent.includes('i want to achieve')
  ) {
    return 'goals';
  }
  if (
    lowerContent.includes('experience') ||
    lowerContent.includes('skill') ||
    lowerContent.includes('proficient')
  ) {
    return 'skills';
  }
  if (
    lowerContent.includes('budget') ||
    lowerContent.includes('income') ||
    lowerContent.includes('expense') ||
    lowerContent.includes('savings')
  ) {
    return 'finances';
  }
  if (
    lowerContent.includes('business') ||
    lowerContent.includes('market') ||
    lowerContent.includes('revenue')
  ) {
    return 'business_plan';
  }

  return 'notes';
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return apiValidationError('No file provided');
    }

    // Get file extension
    const fileName = file.name;
    const extension = '.' + fileName.split('.').pop()?.toLowerCase();

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return apiValidationError(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check if it's a PDF or DOCX (not natively supported yet)
    if (PDF_DOCX_EXTENSIONS.includes(extension)) {
      return apiValidationError(
        `${extension.toUpperCase()} files are not yet supported. Please copy and paste the text content, or convert to .txt first. We're working on adding support for more file types!`
      );
    }

    // Validate file type
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return apiValidationError(
        `Unsupported file type "${extension}". Supported types: ${ALLOWED_EXTENSIONS.join(', ')}`
      );
    }

    // Read file content as text
    let content: string;
    try {
      content = await file.text();
    } catch {
      return apiValidationError(
        'Could not read file content. Please ensure it is a valid text file.'
      );
    }

    // Trim and validate content
    content = content.trim();

    if (!content) {
      return apiValidationError('File is empty. Please upload a file with content.');
    }

    // Limit content length (50000 chars matches documentSchema)
    if (content.length > 50000) {
      content = content.substring(0, 50000);
    }

    // Generate title and detect type
    const title = generateTitle(fileName);
    const documentType = detectDocumentType(content, fileName);

    return apiSuccess({
      title,
      content,
      fileType: extension,
      documentType,
      characterCount: content.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
