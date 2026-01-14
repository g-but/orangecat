import supabase from '@/lib/supabase/browser'
import { logger } from '@/utils/logger'
import { getTableName } from '@/config/entity-registry'

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
    name?: string
    avatar_url?: string
  }
}

// Get featured projects
export async function getFeaturedProjects(limit: number = 6): Promise<FeaturedCampaign[]> {
  try {
    // For now, we'll simulate featured projects by getting high-performing projects
    // In the future, this would query a dedicated featured_projects table
    const { data: projectsData, error } = await (supabase
      .from(getTableName('project')) as any)
      .select(`
        id, title, description, goal_amount, total_funding, contributor_count,
        is_active, featured_image_url, slug, created_at,
        profiles!inner(username, name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('is_active', true)
      .order('total_funding', { ascending: false })
      .limit(limit)
    const projects = projectsData as any[] | null

    if (error) {throw error}

    // Transform to featured projects with simulated featured types
    const featuredProjects: FeaturedCampaign[] = (projects || []).map((project: any, index: number) => {
      const progress = project.goal_amount ? (project.total_funding / project.goal_amount) * 100 : 0
      
      // Determine featured type based on project characteristics
      let featured_type: FeaturedType = 'featured'
      if (progress >= 80) {
        featured_type = 'nearly_funded'
      } else if (project.contributor_count >= 50) {
        featured_type = 'community_choice'
      } else if (project.total_funding >= 10000) {
        featured_type = 'trending'
      } else if (index < 2) {
        featured_type = 'staff_pick'
      } else {
        featured_type = 'new_and_noteworthy'
      }

      return {
        ...project,
        featured_type,
        featured_priority: index + 1,
        profiles: Array.isArray(project.profiles) ? project.profiles[0] : project.profiles
      }
    })

    return featuredProjects
  } catch (error) {
    logger.error('Error fetching featured projects', error, 'Featured')
    return []
  }
}

// Get trending projects (subset of featured)
export async function getTrendingProjects(limit: number = 3): Promise<FeaturedCampaign[]> {
  try {
    const { data: projectsData, error } = await (supabase
      .from(getTableName('project')) as any)
      .select(`
        id, title, description, goal_amount, total_funding, contributor_count,
        is_active, featured_image_url, slug, created_at,
        profiles!inner(username, name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('is_active', true)
      .order('contributor_count', { ascending: false })
      .limit(limit)
    const projects = projectsData as any[] | null

    if (error) {throw error}

    return (projects || []).map((project: any, index: number) => ({
      ...project,
      featured_type: 'trending' as FeaturedType,
      featured_priority: index + 1,
      profiles: Array.isArray(project.profiles) ? project.profiles[0] : project.profiles
    }))
  } catch (error) {
    logger.error('Error fetching trending projects', error, 'Featured')
    return []
  }
}

// Get staff picks
export async function getStaffPicks(limit: number = 3): Promise<FeaturedCampaign[]> {
  try {
    // For now, get projects with good descriptions and images
    const { data: projectsData, error } = await (supabase
      .from(getTableName('project')) as any)
      .select(`
        id, title, description, goal_amount, total_funding, contributor_count,
        is_active, featured_image_url, slug, created_at,
        profiles!inner(username, name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('is_active', true)
      .not('featured_image_url', 'is', null)
      .not('description', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)
    const projects = projectsData as any[] | null

    if (error) {throw error}

    return (projects || []).map((project: any, index: number) => ({
      ...project,
      featured_type: 'staff_pick' as FeaturedType,
      featured_priority: index + 1,
      profiles: Array.isArray(project.profiles) ? project.profiles[0] : project.profiles
    }))
  } catch (error) {
    logger.error('Error fetching staff picks', error, 'Featured')
    return []
  }
}

// Get nearly funded projects
export async function getNearlyFundedProjects(limit: number = 3): Promise<FeaturedCampaign[]> {
  try {
    const { data: projectsData, error } = await (supabase
      .from(getTableName('project')) as any)
      .select(`
        id, title, description, goal_amount, total_funding, contributor_count,
        is_active, featured_image_url, slug, created_at,
        profiles!inner(username, name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('is_active', true)
      .not('goal_amount', 'is', null)
      .order('total_funding', { ascending: false })
      .limit(20) // Get more to filter
    const projects = projectsData as any[] | null

    if (error) {throw error}

    // Filter for projects that are 70%+ funded
    const nearlyFunded = (projects || [])
      .filter((project: any) => {
        const progress = project.goal_amount ? (project.total_funding / project.goal_amount) * 100 : 0
        return progress >= 70 && progress < 100
      })
      .slice(0, limit)

    return nearlyFunded.map((project: any, index: number) => ({
      ...project,
      featured_type: 'nearly_funded' as FeaturedType,
      featured_priority: index + 1,
      profiles: Array.isArray(project.profiles) ? project.profiles[0] : project.profiles
    }))
  } catch (error) {
    logger.error('Error fetching nearly funded projects', error, 'Featured')
    return []
  }
}

// Get new and noteworthy projects
export async function getNewAndNoteworthy(limit: number = 3): Promise<FeaturedCampaign[]> {
  try {
    // Get recent projects with some traction
    const { data: projectsData, error } = await (supabase
      .from(getTableName('project')) as any)
      .select(`
        id, title, description, goal_amount, total_funding, contributor_count,
        is_active, featured_image_url, slug, created_at,
        profiles!inner(username, name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('is_active', true)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .gt('contributor_count', 0) // Has at least some supporters
      .order('created_at', { ascending: false })
      .limit(limit)
    const projects = projectsData as any[] | null

    if (error) {throw error}

    return (projects || []).map((project: any, index: number) => ({
      ...project,
      featured_type: 'new_and_noteworthy' as FeaturedType,
      featured_priority: index + 1,
      profiles: Array.isArray(project.profiles) ? project.profiles[0] : project.profiles
    }))
  } catch (error) {
    logger.error('Error fetching new and noteworthy projects', error, 'Featured')
    return []
  }
}

// Admin function to manually feature a project (future implementation)
export async function featureCampaign(
  projectId: string, 
  featuredType: FeaturedType, 
  priority: number = 1,
  featuredUntil?: string
): Promise<boolean> {
  // This would be implemented when we add a featured_projects table
  // For now, return true to indicate success
  logger.info('Campaign featured', { projectId, featuredType, priority, featuredUntil }, 'Featured')
  return true
}

// Admin function to unfeature a project
export async function unfeatureCampaign(projectId: string): Promise<boolean> {
  // This would be implemented when we add a featured_projects table
  logger.info('Campaign unfeatured', { projectId }, 'Featured')
  return true
} 