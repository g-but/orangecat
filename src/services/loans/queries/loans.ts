/**
 * LOANS SERVICE - Loan Queries
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from loans/index.ts for modularity
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import type {
  LoanResponse,
  LoansListResponse,
  LoansQuery,
  Pagination,
  LoanCategory,
} from '@/types/loans';
import { getCurrentUserId } from '../utils/auth';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * Get a specific loan by ID
 */
export async function getLoan(loanId: string): Promise<LoanResponse> {
  try {
    const userId = await getCurrentUserId();

    let query = supabase
      .from('loans')
      .select(`
        *,
        loan_categories (
          id,
          name,
          description,
          icon
        )
      `)
      .eq('id', loanId);

    // If user is authenticated, they can see their own loans or public loans
    if (userId) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
    } else {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query.single();

    if (error) {
      logger.error('Failed to get loan', error, 'Loans');
      return { success: false, error: error.message };
    }

    return { success: true, loan: data };
  } catch (error) {
    logger.error('Exception getting loan', error, 'Loans');
    return { success: false, error: 'Failed to get loan' };
  }
}

/**
 * Get loans for current user
 */
export async function getUserLoans(
  query?: LoansQuery,
  pagination?: Pagination
): Promise<LoansListResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    let dbQuery = supabase
      .from('loans')
      .select(
        `
        *,
        loan_categories (
          id,
          name,
          description,
          icon
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId);

    // Apply filters
    if (query?.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }
    if (query?.is_public !== undefined) {
      dbQuery = dbQuery.eq('is_public', query.is_public);
    }
    if (query?.category_id) {
      dbQuery = dbQuery.eq('loan_category_id', query.category_id);
    }
    if (query?.min_amount) {
      dbQuery = dbQuery.gte('remaining_balance', query.min_amount);
    }
    if (query?.max_amount) {
      dbQuery = dbQuery.lte('remaining_balance', query.max_amount);
    }

    // Apply sorting
    const sortBy = query?.sort_by || 'created_at';
    const sortOrder = query?.sort_order || 'desc';
    dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const pageSize = Math.min(pagination?.pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const page = pagination?.page || 1;
    const offset = (page - 1) * pageSize;

    dbQuery = dbQuery.range(offset, offset + pageSize - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to get user loans', error, 'Loans');
      return { success: false, error: error.message };
    }

    return { success: true, loans: data || [], total: count || 0 };
  } catch (error) {
    logger.error('Exception getting user loans', error, 'Loans');
    return { success: false, error: 'Failed to get loans' };
  }
}

/**
 * Get available loans for offering (public loans from other users)
 */
export async function getAvailableLoans(
  query?: LoansQuery,
  pagination?: Pagination
): Promise<LoansListResponse> {
  try {
    const userId = await getCurrentUserId();

    // Use the database function for efficiency
    const pageSize = Math.min(pagination?.pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = pagination?.offset || 0;

    const { data, error } = await supabase.rpc('get_available_loans', {
      p_user_id: userId || null,
      p_limit: pageSize,
      p_offset: offset,
    });

    if (error) {
      logger.warn('Database function not available, using fallback', error, 'Loans');

      // Fallback query
      let dbQuery = supabase
        .from('loans')
        .select(
          `
          *,
          loan_categories (
            id,
            name,
            description,
            icon
          ),
          profiles!loans_user_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `,
          { count: 'exact' }
        )
        .eq('is_public', true)
        .eq('status', 'active');

      if (userId) {
        dbQuery = dbQuery.neq('user_id', userId);
      }

      // Apply filters
      if (query?.category_id) {
        dbQuery = dbQuery.eq('loan_category_id', query.category_id);
      }
      if (query?.min_amount) {
        dbQuery = dbQuery.gte('remaining_balance', query.min_amount);
      }
      if (query?.max_amount) {
        dbQuery = dbQuery.lte('remaining_balance', query.max_amount);
      }

      dbQuery = dbQuery.order('created_at', { ascending: false });
      dbQuery = dbQuery.range(offset, offset + pageSize - 1);

      const fallbackResult = await dbQuery;
      if (fallbackResult.error) {
        logger.error('Fallback query failed', fallbackResult.error, 'Loans');
        return { success: false, error: fallbackResult.error.message };
      }

      return { success: true, loans: fallbackResult.data || [], total: fallbackResult.count || 0 };
    }

    return { success: true, loans: data || [], total: data?.length || 0 };
  } catch (error) {
    logger.error('Exception getting available loans', error, 'Loans');
    return { success: false, error: 'Failed to get available loans' };
  }
}

/**
 * Get all loan categories
 */
export async function getLoanCategories(): Promise<{
  success: boolean;
  categories?: LoanCategory[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('loan_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      logger.error('Failed to get loan categories', error, 'Loans');
      return { success: false, error: error.message };
    }

    return { success: true, categories: data || [] };
  } catch (error) {
    logger.error('Exception getting loan categories', error, 'Loans');
    return { success: false, error: 'Failed to get categories' };
  }
}
