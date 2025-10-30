import { logger } from '@/utils/logger';
import supabase from '@/lib/supabase/browser';

export interface FundraisingStats {
  totalProjects: number;
  totalRaised: number;
  totalSupporters: number;
  activeProjects: number;
}

export interface FundraisingActivity {
  type: 'donation' | 'supporter' | 'milestone' | 'project';
  title: string;
  context: string;
  time: string;
  amount?: number;
  currency?: string;
}

/**
 * Get fundraising statistics for a specific user
 */
export async function getUserFundraisingStats(userId: string): Promise<FundraisingStats> {
  try {
    // Use centralized supabase client
    // Get user's projects (both as creator and through organizations)
    const { data: ownedProjects, error: ownedError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId);

    if (ownedError) {
      throw ownedError;
    }

    // Organizations removed in MVP - only use user's own projects
    const uniqueProjects = ownedProjects || [];

    // Get transactions for these projects to calculate stats
    const projectIds = uniqueProjects.map(p => p.id);
    let totalRaised = 0;
    let totalSupporters = 0;

    if (projectIds.length > 0) {
      // Build OR filter for multiple project IDs
      const projectFilters = projectIds.map(id => `to_entity_id.eq.${id}`).join(',');

      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount_sats, from_entity_id, to_entity_id, from_entity_type')
        .eq('to_entity_type', 'project')
        .or(projectFilters)
        .eq('status', 'confirmed');

      if (transactionsError) {
        throw transactionsError;
      }

      totalRaised = transactions?.reduce((sum, t) => sum + (t.amount_sats || 0), 0) || 0;

      // Count unique donors (from_entity_id where from_entity_type = 'profile')
      const uniqueDonors = new Set(
        transactions?.filter(t => t.from_entity_type === 'profile').map(t => t.from_entity_id) || []
      );
      totalSupporters = uniqueDonors.size;
    }

    const totalProjects = uniqueProjects.length;
    const activeProjects = uniqueProjects.filter(p => p.status === 'active').length;

    return {
      totalProjects,
      totalRaised,
      totalSupporters,
      activeProjects,
    };
  } catch (error) {
    logger.error('Error fetching fundraising stats', error, 'Fundraising');
    return {
      totalProjects: 0,
      totalRaised: 0,
      totalSupporters: 0,
      activeProjects: 0,
    };
  }
}

/**
 * Get recent fundraising activity for a user
 */
export async function getUserFundraisingActivity(
  userId: string,
  limit: number = 10
): Promise<FundraisingActivity[]> {
  try {
    // Use centralized supabase client
    const activities: FundraisingActivity[] = [];

    // Get user's funding pages
    const { data: pages, error: pagesError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (pagesError) {
      throw pagesError;
    }

    const pageIds = pages?.map(page => page.id) || [];

    // Get recent transactions
    if (pageIds.length > 0) {
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select(
          `
          *,
          projects!inner(title)
        `
        )
        .in('funding_page_id', pageIds)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!transactionsError && transactions) {
        transactions.forEach(transaction => {
          const timeDiff = Date.now() - new Date(transaction.created_at).getTime();
          const timeAgo = formatTimeAgo(timeDiff);

          activities.push({
            type: 'donation',
            title: 'New donation received',
            context: (transaction as any).projects.title,
            time: timeAgo,
            amount: transaction.amount,
            currency: 'SATS',
          });
        });
      }
    }

    // Add project creation activities
    pages?.slice(0, 3).forEach(page => {
      const timeDiff = Date.now() - new Date(page.created_at).getTime();
      const timeAgo = formatTimeAgo(timeDiff);

      activities.push({
        type: 'project',
        title: 'Campaign created',
        context: page.title,
        time: timeAgo,
      });
    });

    // Sort by most recent and limit
    return activities.sort((a, b) => parseTimeAgo(a.time) - parseTimeAgo(b.time)).slice(0, limit);
  } catch (error) {
    logger.error('Error fetching fundraising activity', error, 'Fundraising');
    return [];
  }
}

/**
 * Get all projects for a user (both owned and through organizations)
 */
export async function getUserProjects(userId: string): Promise<any[]> {
  try {
    // Get user's projects (both as creator and through organizations)
    const { data: ownedProjects, error: ownedError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ownedError) {
      throw ownedError;
    }

    // Organizations removed in MVP - only return user's own projects
    return ownedProjects || [];
  } catch (error) {
    logger.error('Error fetching projects', error, 'Fundraising');
    return [];
  }
}

/**
 * Get a single project by ID
 */
export async function getProject(projectId: string): Promise<any | null> {
  try {
    // Use centralized supabase client
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    logger.error('Error fetching project', error, 'Fundraising');
    return null;
  }
}

/**
 * Get global fundraising statistics (for admin/overview purposes)
 */
export async function getGlobalFundraisingStats(): Promise<FundraisingStats> {
  try {
    // Use centralized supabase client
    // Get all funding pages
    const { data: pages, error: pagesError } = await supabase
      .from('projects')
      .select('*')
      .eq('is_public', true);

    if (pagesError) {
      throw pagesError;
    }

    // Get all confirmed transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('user_id, amount')
      .eq('status', 'confirmed');

    if (transactionsError) {
      throw transactionsError;
    }

    const totalProjects = pages?.length || 0;
    // Current schema doesn't have is_active, so assume all public pages are active
    const activeProjects = pages?.filter(page => page.is_public).length || 0;
    // Current schema doesn't have total_funding, so use 0 for now
    const totalRaised = 0;

    // Count unique supporters
    const uniqueSupporters = new Set(transactions?.map(t => t.user_id) || []);
    const totalSupporters = uniqueSupporters.size;

    return {
      totalProjects,
      totalRaised,
      totalSupporters,
      activeProjects,
    };
  } catch (error) {
    logger.error('Error fetching global fundraising stats', error, 'Fundraising');
    return {
      totalProjects: 0,
      totalRaised: 0,
      totalSupporters: 0,
      activeProjects: 0,
    };
  }
}

export async function getRecentDonationsCount(userId: string): Promise<number> {
  try {
    // Use centralized supabase client

    // Get start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get user's funding pages
    const { data: pages, error: pagesError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId);

    if (pagesError) {
      throw pagesError;
    }
    if (!pages || pages.length === 0) {
      return 0;
    }

    const pageIds = pages.map(page => page.id);

    // Count transactions this month
    const { count, error: transactionsError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .in('funding_page_id', pageIds)
      .eq('status', 'confirmed')
      .gte('created_at', startOfMonth.toISOString());

    if (transactionsError) {
      throw transactionsError;
    }

    return count || 0;
  } catch (error) {
    logger.error('Error getting recent donations count', error, 'Fundraising');
    return 0;
  }
}

// Helper functions
function formatTimeAgo(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

function parseTimeAgo(timeString: string): number {
  if (timeString === 'Just now') {
    return 0;
  }

  const match = timeString.match(/(\d+)\s+(minute|hour|day)s?\s+ago/);
  if (!match) {
    return 0;
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'minute':
      return value;
    case 'hour':
      return value * 60;
    case 'day':
      return value * 60 * 24;
    default:
      return 0;
  }
}
