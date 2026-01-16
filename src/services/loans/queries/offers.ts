/**
 * LOANS SERVICE - Loan Offer Queries
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from loans/index.ts for modularity
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import type {
  LoanOffersListResponse,
  LoanOffersQuery,
  Pagination,
} from '@/types/loans';
import { getCurrentUserId } from '../utils/auth';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * Get offers for a loan
 */
export async function getLoanOffers(
  loanId: string,
  query?: LoanOffersQuery,
  pagination?: Pagination
): Promise<LoanOffersListResponse> {
  try {
    const _userId = await getCurrentUserId();

    let dbQuery = supabase
      .from('loan_offers')
      .select(
        `
        *,
        profiles!loan_offers_offerer_id_fkey (
          username,
          display_name,
          avatar_url
        )
      `,
        { count: 'exact' }
      )
      .eq('loan_id', loanId);

    // Apply filters
    if (query?.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }
    if (query?.offer_type) {
      dbQuery = dbQuery.eq('offer_type', query.offer_type);
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
      logger.error('Failed to get loan offers', error, 'Loans');
      return { success: false, error: error.message };
    }

    return { success: true, offers: data || [], total: count || 0 };
  } catch (error) {
    logger.error('Exception getting loan offers', error, 'Loans');
    return { success: false, error: 'Failed to get offers' };
  }
}

/**
 * Get offers the current user has made
 */
export async function getUserOffers(
  query?: LoanOffersQuery,
  pagination?: Pagination
): Promise<LoanOffersListResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    let dbQuery = supabase
      .from('loan_offers')
      .select(
        `
        *,
        loans!loan_offers_loan_id_fkey (
          id,
          title,
          remaining_balance,
          interest_rate,
          currency,
          status,
          user_id
        )
      `,
        { count: 'exact' }
      )
      .eq('offerer_id', userId);

    if (query?.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }
    if (query?.offer_type) {
      dbQuery = dbQuery.eq('offer_type', query.offer_type);
    }

    const sortBy = query?.sort_by || 'created_at';
    const sortOrder = query?.sort_order || 'desc';
    dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    const pageSize = Math.min(pagination?.pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const page = pagination?.page || 1;
    const offset = (page - 1) * pageSize;
    dbQuery = dbQuery.range(offset, offset + pageSize - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to get user offers', error, 'Loans');
      return { success: false, error: error.message };
    }

    return { success: true, offers: data || [], total: count || 0 };
  } catch (error) {
    logger.error('Exception getting user offers', error, 'Loans');
    return { success: false, error: 'Failed to get offers' };
  }
}
