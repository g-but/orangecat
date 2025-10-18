import { FundingPage, Transaction } from '@/types/funding'
import { logger } from '@/utils/logger'
import supabase from '@/services/supabase/client'

export interface FundraisingStats {
  totalCampaigns: number
  totalRaised: number
  totalSupporters: number
  activeCampaigns: number
}

export interface FundraisingActivity {
  type: 'donation' | 'supporter' | 'milestone' | 'campaign'
  title: string
  context: string
  time: string
  amount?: number
  currency?: string
}

/**
 * Get fundraising statistics for a specific user
 */
export async function getUserFundraisingStats(userId: string): Promise<FundraisingStats> {
  try {
    // Use centralized supabase client
    // Get user's funding pages
    const { data: pages, error: pagesError } = await supabase
      .from('funding_pages')
      .select('*')
      .eq('user_id', userId)

    if (pagesError) {throw pagesError}

    // Get transactions for user's pages
    const pageIds = pages?.map(page => page.id) || []
    let totalSupporters = 0
    
    if (pageIds.length > 0) {
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('funding_page_id, user_id')
        .in('funding_page_id', pageIds)
        .eq('status', 'confirmed')

      if (transactionsError) {throw transactionsError}

      // Count unique supporters across all campaigns
      const uniqueSupporters = new Set(transactions?.map(t => t.user_id) || [])
      totalSupporters = uniqueSupporters.size
    }

    const totalCampaigns = pages?.length || 0
    // Current schema doesn't have is_active, so assume all public pages are active
    const activeCampaigns = pages?.filter(page => page.is_public).length || 0
    // Current schema doesn't have total_funding, so use 0 for now
    const totalRaised = 0

    return {
      totalCampaigns,
      totalRaised,
      totalSupporters,
      activeCampaigns
    }
  } catch (error) {
    logger.error('Error fetching fundraising stats', error, 'Fundraising')
    return {
      totalCampaigns: 0,
      totalRaised: 0,
      totalSupporters: 0,
      activeCampaigns: 0
    }
  }
}

/**
 * Get recent fundraising activity for a user
 */
export async function getUserFundraisingActivity(userId: string, limit: number = 10): Promise<FundraisingActivity[]> {
  try {
    // Use centralized supabase client
    const activities: FundraisingActivity[] = []

    // Get user's funding pages
    const { data: pages, error: pagesError } = await supabase
      .from('funding_pages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (pagesError) {throw pagesError}

    const pageIds = pages?.map(page => page.id) || []

    // Get recent transactions
    if (pageIds.length > 0) {
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          funding_pages!inner(title)
        `)
        .in('funding_page_id', pageIds)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!transactionsError && transactions) {
        transactions.forEach(transaction => {
          const timeDiff = Date.now() - new Date(transaction.created_at).getTime()
          const timeAgo = formatTimeAgo(timeDiff)

          activities.push({
            type: 'donation',
            title: 'New donation received',
            context: (transaction as any).funding_pages.title,
            time: timeAgo,
            amount: transaction.amount,
            currency: 'SATS'
          })
        })
      }
    }

    // Add campaign creation activities
    pages?.slice(0, 3).forEach(page => {
      const timeDiff = Date.now() - new Date(page.created_at).getTime()
      const timeAgo = formatTimeAgo(timeDiff)

      activities.push({
        type: 'campaign',
        title: 'Campaign created',
        context: page.title,
        time: timeAgo
      })
    })

    // Sort by most recent and limit
    return activities
      .sort((a, b) => parseTimeAgo(a.time) - parseTimeAgo(b.time))
      .slice(0, limit)

  } catch (error) {
    logger.error('Error fetching fundraising activity', error, 'Fundraising')
    return []
  }
}

/**
 * Get all funding pages for a user
 */
export async function getUserFundingPages(userId: string): Promise<FundingPage[]> {
  try {
    // Use centralized supabase client
    const { data, error } = await supabase
      .from('funding_pages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {throw error}
    return data || []
  } catch (error) {
    logger.error('Error fetching funding pages', error, 'Fundraising')
    return []
  }
}

/**
 * Get a single funding page by ID
 */
export async function getFundingPage(pageId: string): Promise<FundingPage | null> {
  try {
    // Use centralized supabase client
    const { data, error } = await supabase
      .from('funding_pages')
      .select('*')
      .eq('id', pageId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw error
    }
    return data
  } catch (error) {
    logger.error('Error fetching funding page', error, 'Fundraising')
    return null
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
      .from('funding_pages')
      .select('*')
      .eq('is_public', true)

    if (pagesError) {throw pagesError}

    // Get all confirmed transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('user_id, amount')
      .eq('status', 'confirmed')

    if (transactionsError) {throw transactionsError}

    const totalCampaigns = pages?.length || 0
    // Current schema doesn't have is_active, so assume all public pages are active
    const activeCampaigns = pages?.filter(page => page.is_public).length || 0
    // Current schema doesn't have total_funding, so use 0 for now
    const totalRaised = 0
    
    // Count unique supporters
    const uniqueSupporters = new Set(transactions?.map(t => t.user_id) || [])
    const totalSupporters = uniqueSupporters.size

    return {
      totalCampaigns,
      totalRaised,
      totalSupporters,
      activeCampaigns
    }
  } catch (error) {
    logger.error('Error fetching global fundraising stats', error, 'Fundraising')
    return {
      totalCampaigns: 0,
      totalRaised: 0,
      totalSupporters: 0,
      activeCampaigns: 0
    }
  }
}

export async function getRecentDonationsCount(userId: string): Promise<number> {
  try {
    // Use centralized supabase client

    // Get start of current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get user's funding pages
    const { data: pages, error: pagesError } = await supabase
      .from('funding_pages')
      .select('id')
      .eq('user_id', userId)

    if (pagesError) {throw pagesError}
    if (!pages || pages.length === 0) {return 0}

    const pageIds = pages.map(page => page.id)

    // Count transactions this month
    const { count, error: transactionsError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .in('funding_page_id', pageIds)
      .eq('status', 'confirmed')
      .gte('created_at', startOfMonth.toISOString())

    if (transactionsError) {throw transactionsError}

    return count || 0
  } catch (error) {
    logger.error('Error getting recent donations count', error, 'Fundraising')
    return 0
  }
}

// Helper functions
function formatTimeAgo(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {return `${days} day${days > 1 ? 's' : ''} ago`}
  if (hours > 0) {return `${hours} hour${hours > 1 ? 's' : ''} ago`}
  if (minutes > 0) {return `${minutes} minute${minutes > 1 ? 's' : ''} ago`}
  return 'Just now'
}

function parseTimeAgo(timeString: string): number {
  if (timeString === 'Just now') {return 0}
  
  const match = timeString.match(/(\d+)\s+(minute|hour|day)s?\s+ago/)
  if (!match) {return 0}
  
  const value = parseInt(match[1])
  const unit = match[2]
  
  switch (unit) {
    case 'minute': return value
    case 'hour': return value * 60
    case 'day': return value * 60 * 24
    default: return 0
  }
} 