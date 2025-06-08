import { createBrowserClient } from '@supabase/ssr'
import { logger } from '@/utils/logger'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type FeaturedType = 
  | 'trending' 
  | 'staff_pick' 
  | 'community_choice' 
  | 'nearly_funded' 
  | 'new_and_noteworthy'
  | 'featured'

export interface FeaturedCampaign {
  id: string
  title: string
  description: string
  goal_amount: number
  total_funding: number
  contributor_count: number
  is_active: boolean
  featured_image_url?: string
  slug?: string
  created_at: string
  end_date?: string
  featured_type: FeaturedType
  featured_priority: number
  featured_until?: string
  profiles?: {
    username: string
    display_name?: string
    avatar_url?: string
  }
}

// Get featured campaigns
export async function getFeaturedCampaigns(limit: number = 6): Promise<FeaturedCampaign[]> {
  try {
    // For now, we'll simulate featured campaigns by getting high-performing campaigns
    // In the future, this would query a dedicated featured_campaigns table
    const { data: campaigns, error } = await supabase
      .from('funding_pages')
      .select(`
        id, title, description, goal_amount, total_funding, contributor_count,
        is_active, featured_image_url, slug, created_at,
        profiles!inner(username, display_name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('is_active', true)
      .order('total_funding', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Transform to featured campaigns with simulated featured types
    const featuredCampaigns: FeaturedCampaign[] = (campaigns || []).map((campaign, index) => {
      const progress = campaign.goal_amount ? (campaign.total_funding / campaign.goal_amount) * 100 : 0
      
      // Determine featured type based on campaign characteristics
      let featured_type: FeaturedType = 'featured'
      if (progress >= 80) {
        featured_type = 'nearly_funded'
      } else if (campaign.contributor_count >= 50) {
        featured_type = 'community_choice'
      } else if (campaign.total_funding >= 10000) {
        featured_type = 'trending'
      } else if (index < 2) {
        featured_type = 'staff_pick'
      } else {
        featured_type = 'new_and_noteworthy'
      }

      return {
        ...campaign,
        featured_type,
        featured_priority: index + 1,
        profiles: Array.isArray(campaign.profiles) ? campaign.profiles[0] : campaign.profiles
      }
    })

    return featuredCampaigns
  } catch (error) {
    console.error('Error fetching featured campaigns:', error)
    return []
  }
}

// Get trending campaigns (subset of featured)
export async function getTrendingCampaigns(limit: number = 3): Promise<FeaturedCampaign[]> {
  try {
    const { data: campaigns, error } = await supabase
      .from('funding_pages')
      .select(`
        id, title, description, goal_amount, total_funding, contributor_count,
        is_active, featured_image_url, slug, created_at,
        profiles!inner(username, display_name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('is_active', true)
      .order('contributor_count', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (campaigns || []).map((campaign, index) => ({
      ...campaign,
      featured_type: 'trending' as FeaturedType,
      featured_priority: index + 1,
      profiles: Array.isArray(campaign.profiles) ? campaign.profiles[0] : campaign.profiles
    }))
  } catch (error) {
    console.error('Error fetching trending campaigns:', error)
    return []
  }
}

// Get staff picks
export async function getStaffPicks(limit: number = 3): Promise<FeaturedCampaign[]> {
  try {
    // For now, get campaigns with good descriptions and images
    const { data: campaigns, error } = await supabase
      .from('funding_pages')
      .select(`
        id, title, description, goal_amount, total_funding, contributor_count,
        is_active, featured_image_url, slug, created_at,
        profiles!inner(username, display_name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('is_active', true)
      .not('featured_image_url', 'is', null)
      .not('description', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (campaigns || []).map((campaign, index) => ({
      ...campaign,
      featured_type: 'staff_pick' as FeaturedType,
      featured_priority: index + 1,
      profiles: Array.isArray(campaign.profiles) ? campaign.profiles[0] : campaign.profiles
    }))
  } catch (error) {
    console.error('Error fetching staff picks:', error)
    return []
  }
}

// Get nearly funded campaigns
export async function getNearlyFundedCampaigns(limit: number = 3): Promise<FeaturedCampaign[]> {
  try {
    const { data: campaigns, error } = await supabase
      .from('funding_pages')
      .select(`
        id, title, description, goal_amount, total_funding, contributor_count,
        is_active, featured_image_url, slug, created_at,
        profiles!inner(username, display_name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('is_active', true)
      .not('goal_amount', 'is', null)
      .order('total_funding', { ascending: false })
      .limit(20) // Get more to filter

    if (error) throw error

    // Filter for campaigns that are 70%+ funded
    const nearlyFunded = (campaigns || [])
      .filter(campaign => {
        const progress = campaign.goal_amount ? (campaign.total_funding / campaign.goal_amount) * 100 : 0
        return progress >= 70 && progress < 100
      })
      .slice(0, limit)

    return nearlyFunded.map((campaign, index) => ({
      ...campaign,
      featured_type: 'nearly_funded' as FeaturedType,
      featured_priority: index + 1,
      profiles: Array.isArray(campaign.profiles) ? campaign.profiles[0] : campaign.profiles
    }))
  } catch (error) {
    console.error('Error fetching nearly funded campaigns:', error)
    return []
  }
}

// Get new and noteworthy campaigns
export async function getNewAndNoteworthy(limit: number = 3): Promise<FeaturedCampaign[]> {
  try {
    // Get recent campaigns with some traction
    const { data: campaigns, error } = await supabase
      .from('funding_pages')
      .select(`
        id, title, description, goal_amount, total_funding, contributor_count,
        is_active, featured_image_url, slug, created_at,
        profiles!inner(username, display_name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('is_active', true)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .gt('contributor_count', 0) // Has at least some supporters
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (campaigns || []).map((campaign, index) => ({
      ...campaign,
      featured_type: 'new_and_noteworthy' as FeaturedType,
      featured_priority: index + 1,
      profiles: Array.isArray(campaign.profiles) ? campaign.profiles[0] : campaign.profiles
    }))
  } catch (error) {
    console.error('Error fetching new and noteworthy campaigns:', error)
    return []
  }
}

// Admin function to manually feature a campaign (future implementation)
export async function featureCampaign(
  campaignId: string, 
  featuredType: FeaturedType, 
  priority: number = 1,
  featuredUntil?: string
): Promise<boolean> {
  // This would be implemented when we add a featured_campaigns table
  // For now, return true to indicate success
  logger.info('Campaign featured', { campaignId, featuredType, priority, featuredUntil }, 'Featured')
  return true
}

// Admin function to unfeature a campaign
export async function unfeatureCampaign(campaignId: string): Promise<boolean> {
  // This would be implemented when we add a featured_campaigns table
  logger.info('Campaign unfeatured', { campaignId }, 'Featured')
  return true
} 