import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { loanSchema } from '@/lib/validation';
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
  apiInternalError,
  handleApiError,
  handleSupabaseError,
} from '@/lib/api/standardResponse';
import { rateLimit, rateLimitWrite, createRateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { apiRateLimited } from '@/lib/api/standardResponse';

interface PageProps {
  params: Promise<{ id: string }>
}

// GET /api/loans/[id] - Get specific loan
export async function GET(request: NextRequest, { params }: PageProps) {
  try {
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const supabase = await createServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    
    const { id } = await params;

    // For now, only allow users to see their own loans
    // TODO: Add public loan listings if needed
    if (!user) {
      return apiUnauthorized();
    }

    const { data: loan, error } = await supabase
      .from('loans')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return apiNotFound('Loan not found');
      }
      return apiInternalError('Failed to fetch loan', { details: error.message });
    }

    return apiSuccess(loan);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/loans/[id] - Update loan
export async function PUT(request: NextRequest, { params }: PageProps) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const { id } = await params;

    // Check if loan exists and belongs to user
    const { data: existingLoan, error: fetchError } = await supabase
      .from('loans')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingLoan) {
      return apiNotFound('Loan not found');
    }

    if (existingLoan.user_id !== user.id) {
      return apiUnauthorized('You can only update your own loans');
    }

    // Rate limiting check
    const rateLimitResult = rateLimitWrite(user.id);
    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many update requests. Please slow down.', retryAfter);
    }

    const body = await request.json();
    const validatedData = loanSchema.parse(body);

    const updatePayload = {
      title: validatedData.title,
      description: validatedData.description,
      loan_category_id: validatedData.loan_category_id,
      original_amount: validatedData.original_amount,
      remaining_balance: validatedData.remaining_balance,
      interest_rate: validatedData.interest_rate,
      bitcoin_address: validatedData.bitcoin_address,
      lightning_address: validatedData.lightning_address,
      fulfillment_type: validatedData.fulfillment_type ?? 'manual',
      updated_at: new Date().toISOString(),
    };

    const { data: loan, error } = await supabase
      .from('loans')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      logger.error('Loan update failed', {
        userId: user.id,
        loanId: id,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('Loan updated successfully', { userId: user.id, loanId: id });
    return apiSuccess(loan);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return apiValidationError('Invalid loan data', {
        details: zodError.errors || zodError.message,
      });
    }
    return handleApiError(error);
  }
}

// DELETE /api/loans/[id] - Delete loan
export async function DELETE(request: NextRequest, { params }: PageProps) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const { id } = await params;

    // Check if loan exists and belongs to user
    const { data: existingLoan, error: fetchError } = await supabase
      .from('loans')
      .select('user_id, title')
      .eq('id', id)
      .single();

    if (fetchError || !existingLoan) {
      return apiNotFound('Loan not found');
    }

    if (existingLoan.user_id !== user.id) {
      return apiUnauthorized('You can only delete your own loans');
    }

    const { error } = await supabase
      .from('loans')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Loan deletion failed', {
        userId: user.id,
        loanId: id,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('Loan deleted successfully', { userId: user.id, loanId: id });
    return apiSuccess({ message: 'Loan deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}


