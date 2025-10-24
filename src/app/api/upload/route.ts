import { logger } from '@/utils/logger';
import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiInternalError,
  handleApiError,
} from '@/lib/api/standardResponse';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'avatars';

    if (!file) {
      return apiValidationError('No file provided');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return apiValidationError(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiValidationError('Only image files (JPEG, PNG, WebP, GIF) are allowed');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data, error: uploadError } = await supabase.storage
      .from('avatars') // Use the existing avatars bucket
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Upload error:', uploadError);
      return apiInternalError(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath);

    return apiSuccess({
      url: publicUrl,
      path: filePath,
      fileName: fileName,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/upload - Delete an uploaded file
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return apiValidationError('File path is required');
    }

    // Verify the file belongs to the user
    if (!filePath.startsWith(`avatars/${user.id}`) && !filePath.startsWith(`banners/${user.id}`)) {
      return apiValidationError('You can only delete your own files');
    }

    const { error: deleteError } = await supabase.storage.from('avatars').remove([filePath]);

    if (deleteError) {
      return apiInternalError(`Delete failed: ${deleteError.message}`);
    }

    return apiSuccess({ message: 'File deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
