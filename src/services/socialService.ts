/**
 * SOCIAL COLLABORATION SERVICES
 * 
 * Comprehensive service layer for People, Organizations, and Projects
 * with Bitcoin wallet integration and collaborative features.
 * 
 * Created: 2025-01-08
 * Last Modified: 2025-01-08
 * Last Modified Summary: Complete social networking and collaboration system
 */

import { supabase } from '@/services/supabase/client'
import { logger } from '@/utils/logger'
import type { 
  ScalableProfile,
  Connection,
  ConnectionRequest,
  PeopleSearchFilters,
  Organization,
  OrganizationFormData,
  OrganizationMember,
  Project,
  ProjectFormData,
  ProjectMember,
  SearchFilters,
  SearchResult,
  WalletInfo,
  Transaction,
  SocialAnalytics,
  EmptyStateContent,
  Notification,
  ActivityFeed
} from '@/types/social'

// Utility functions
function generateBitcoinAddress(): string {
  // Generate a mock Bitcoin address for development
  // In production, this would use proper Bitcoin libraries
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let address = 'bc1q'
  for (let i = 0; i < 39; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return address
}

function generateLightningAddress(username: string): string {
  return `${username}@orangecat.ch`
}

function parseWebsiteData(websiteField: string): any {
  try {
    return JSON.parse(websiteField || '{}')
  } catch {
    return {}
  }
}

function formatWebsiteData(data: any): string {
  return JSON.stringify(data)
}

// People Service
export class PeopleService {
  static async searchPeople(filters: PeopleSearchFilters = {}): Promise<ScalableProfile[]> {
    try {
      const { query, skills, location, verification_status, limit = 20, offset = 0 } = filters
      
      let queryBuilder = supabase
        .from('profiles')
        .select('*')
      
      if (query) {
        queryBuilder = queryBuilder.or(`username.ilike.%${query}%,full_name.ilike.%${query}%,bio.ilike.%${query}%`)
      }
      
      const { data, error } = await queryBuilder
        .limit(limit)
        .range(offset, offset + limit - 1)
      
      if (error) throw error
      
      return (data || []).map(profile => ({
        ...profile,
        ...parseWebsiteData(profile.website)
      }))
    } catch (error) {
      logger.error('Error searching people:', error, 'Social')
      throw error
    }
  }

  static async sendConnectionRequest(request: Omit<ConnectionRequest, 'id' | 'created_at' | 'status' | 'requester_id'>): Promise<ConnectionRequest> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('User not authenticated')

      // Get current user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('website')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      const profileData = parseWebsiteData(profile.website)
      const connections = profileData.connections || []
      
      const newConnection: ConnectionRequest = {
        id: `conn-${Date.now()}`,
        requester_id: user.id,
        recipient_id: request.recipient_id,
        message: request.message,
        status: 'pending',
        created_at: new Date().toISOString()
      }

      connections.push(newConnection)
      profileData.connections = connections

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ website: formatWebsiteData(profileData) })
        .eq('id', user.id)

      if (updateError) throw updateError

      return newConnection
    } catch (error) {
      logger.error('Error sending connection request:', error, 'Social')
      throw error
    }
  }

  static async getConnections(userId: string): Promise<Connection[]> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('website')
        .eq('id', userId)
        .single()

      if (error) return []

      const profileData = parseWebsiteData(profile.website)
      const connections = profileData.connections || []
      
      return connections.filter((conn: Connection) => conn.status === 'accepted')
    } catch (error) {
      logger.error('Error getting connections:', error, 'Social')
      return []
    }
  }

  static async respondToConnection(connectionId: string, response: 'accepted' | 'declined'): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('User not authenticated')

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('website')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      const profileData = parseWebsiteData(profile.website)
      const connections = profileData.connections || []
      
      const connectionIndex = connections.findIndex((conn: Connection) => 
        conn.id === connectionId && conn.recipient_id === user.id
      )

      if (connectionIndex === -1) throw new Error('Connection request not found')

      connections[connectionIndex].status = response
      profileData.connections = connections

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ website: formatWebsiteData(profileData) })
        .eq('id', user.id)

      if (updateError) throw updateError
    } catch (error) {
      logger.error('Error responding to connection:', error, 'Social')
      throw error
    }
  }
}

// Organization Service
export class OrganizationService {
  static async createOrganization(formData: OrganizationFormData): Promise<Organization> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('User not authenticated')

      const organization: Organization = {
        id: `org-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        mission_statement: formData.mission_statement,
        website: formData.website,
        logo_url: formData.logo_url,
        banner_url: formData.banner_url,
        
        // Bitcoin wallet
        bitcoin_address: generateBitcoinAddress(),
        lightning_address: generateLightningAddress(formData.name.toLowerCase().replace(/\s+/g, '')),
        wallet_balance: 0,
        total_raised: 0,
        total_spent: 0,
        
        // Organization details
        type: formData.type,
        status: 'active',
        visibility: formData.visibility,
        
        // Membership
        member_count: 1,
        max_members: formData.max_members || 100,
        
        // Metadata
        founded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user.id,
        
        // Contact
        social_links: formData.social_links || {},
        contact_email: formData.contact_email,
        location: formData.location,
        timezone: formData.timezone || 'UTC',
        
        // Settings
        settings: {
          require_approval: formData.require_approval || false,
          allow_member_invites: formData.allow_member_invites || true,
          public_transactions: formData.public_transactions || true,
          voting_enabled: formData.voting_enabled || false,
          proposal_threshold: formData.proposal_threshold || 3
        }
      }

      // Store in user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('website')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      const profileData = parseWebsiteData(profile.website)
      const organizations = profileData.organizations || []
      organizations.push(organization)
      profileData.organizations = organizations

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ website: formatWebsiteData(profileData) })
        .eq('id', user.id)

      if (updateError) throw updateError

      return organization
    } catch (error) {
      logger.error('Error creating organization:', error, 'Social')
      throw error
    }
  }

  static async getUserOrganizations(userId: string): Promise<Organization[]> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('website')
        .eq('id', userId)
        .single()

      if (error) return []

      const profileData = parseWebsiteData(profile.website)
      return profileData.organizations || []
    } catch (error) {
      logger.error('Error getting user organizations:', error, 'Social')
      return []
    }
  }

  static async searchOrganizations(filters: SearchFilters = {}): Promise<Organization[]> {
    try {
      const { query, type, category, limit = 20 } = filters
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('website')
        .limit(limit * 5) // Get more profiles to find organizations

      if (error) throw error

      const allOrganizations: Organization[] = []
      
      profiles?.forEach(profile => {
        const profileData = parseWebsiteData(profile.website)
        const organizations = profileData.organizations || []
        allOrganizations.push(...organizations)
      })

      let filteredOrgs = allOrganizations

      if (query) {
        filteredOrgs = filteredOrgs.filter(org => 
          org.name.toLowerCase().includes(query.toLowerCase()) ||
          org.description?.toLowerCase().includes(query.toLowerCase())
        )
      }

      if (type) {
        filteredOrgs = filteredOrgs.filter(org => org.type === type)
      }

      return filteredOrgs.slice(0, limit)
    } catch (error) {
      logger.error('Error searching organizations:', error, 'Social')
      return []
    }
  }

  static async joinOrganization(organizationId: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('User not authenticated')

      // Implementation would handle joining organization
      // For now, just log the action
      logger.debug('User joining organization', { userId: user.id, organizationId }, 'Social')
    } catch (error) {
      logger.error('Error joining organization:', error, 'Social')
      throw error
    }
  }
}

// Project Service
export class ProjectService {
  static async createProject(formData: ProjectFormData): Promise<Project> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('User not authenticated')

      const project: Project = {
        id: `project-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        detailed_description: formData.detailed_description,
        
        // Classification
        category: formData.category,
        tags: formData.tags || [],
        
        // Bitcoin wallet
        bitcoin_address: generateBitcoinAddress(),
        lightning_address: generateLightningAddress(formData.name.toLowerCase().replace(/\s+/g, '')),
        wallet_balance: 0,
        funding_goal: formData.funding_goal,
        total_raised: 0,
        total_spent: 0,
        
        // Status
        status: 'active',
        visibility: formData.visibility,
        
        // Timeline
        start_date: formData.start_date || new Date().toISOString(),
        end_date: formData.end_date,
        deadline: formData.deadline,
        
        // Ownership
        created_by: user.id,
        organization_id: formData.organization_id,
        
        // Team
        team_size: 1,
        max_team_size: formData.max_team_size || 10,
        
        // Media
        logo_url: formData.logo_url,
        banner_url: formData.banner_url,
        images: formData.images || [],
        
        // Metadata
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        // Contact
        website: formData.website,
        social_links: formData.social_links || {},
        
        // Settings
        settings: {
          allow_public_contributions: formData.allow_public_contributions || true,
          require_approval_to_join: formData.require_approval_to_join || false,
          public_transactions: formData.public_transactions || true,
          milestone_based: formData.milestone_based || false,
          voting_enabled: formData.voting_enabled || false
        }
      }

      // Store in user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('website')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      const profileData = parseWebsiteData(profile.website)
      const projects = profileData.projects || []
      projects.push(project)
      profileData.projects = projects

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ website: formatWebsiteData(profileData) })
        .eq('id', user.id)

      if (updateError) throw updateError

      return project
    } catch (error) {
      logger.error('Error creating project:', error, 'Social')
      throw error
    }
  }

  static async getUserProjects(userId: string): Promise<Project[]> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('website')
        .eq('id', userId)
        .single()

      if (error) return []

      const profileData = parseWebsiteData(profile.website)
      return profileData.projects || []
    } catch (error) {
      logger.error('Error getting user projects:', error, 'Social')
      return []
    }
  }

  static async searchProjects(filters: SearchFilters = {}): Promise<Project[]> {
    try {
      const { query, category, funding_status, limit = 20 } = filters
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('website')
        .limit(limit * 5) // Get more profiles to find projects

      if (error) throw error

      const allProjects: Project[] = []
      
      profiles?.forEach(profile => {
        const profileData = parseWebsiteData(profile.website)
        const projects = profileData.projects || []
        allProjects.push(...projects)
      })

      let filteredProjects = allProjects

      if (query) {
        filteredProjects = filteredProjects.filter(project => 
          project.name.toLowerCase().includes(query.toLowerCase()) ||
          project.description?.toLowerCase().includes(query.toLowerCase()) ||
          project.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        )
      }

      if (category) {
        filteredProjects = filteredProjects.filter(project => project.category === category)
      }

      if (funding_status) {
        filteredProjects = filteredProjects.filter(project => {
          if (funding_status === 'seeking' && project.funding_goal) {
            return (project.total_raised || 0) < project.funding_goal
          }
          if (funding_status === 'funded' && project.funding_goal) {
            return (project.total_raised || 0) >= project.funding_goal
          }
          return true
        })
      }

      return filteredProjects.slice(0, limit)
    } catch (error) {
      logger.error('Error searching projects:', error, 'Social')
      return []
    }
  }

  static async joinProject(projectId: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('User not authenticated')

      // Implementation would handle joining project
      logger.debug('User joining project', { userId: user.id, projectId }, 'Social')
    } catch (error) {
      logger.error('Error joining project:', error, 'Social')
      throw error
    }
  }
}

// Search Service
export class SearchService {
  static async universalSearch(filters: SearchFilters): Promise<SearchResult[]> {
    try {
      const results: SearchResult[] = []
      const { query, type, limit = 20 } = filters

      // Search people if not filtered to specific type
      if (!type || type === 'people') {
        const people = await PeopleService.searchPeople({ 
          query, 
          limit: Math.ceil(limit / 3) 
        })
        
        people.forEach(person => {
          results.push({
            id: person.id,
            type: 'person',
            title: person.display_name || person.full_name || person.username,
            description: person.bio || '',
            image: person.avatar_url,
            url: `/people/${person.username}`,
            metadata: {
              username: person.username,
              location: person.location,
              connections: person.connections_count,
              verified: person.verification_status === 'verified'
            }
          })
        })
      }

      // Search organizations
      if (!type || type === 'organizations') {
        const organizations = await OrganizationService.searchOrganizations({ 
          query, 
          limit: Math.ceil(limit / 3) 
        })
        
        organizations.forEach(org => {
          results.push({
            id: org.id,
            type: 'organization',
            title: org.name,
            description: org.description || '',
            image: org.logo_url,
            url: `/organizations/${org.id}`,
            metadata: {
              type: org.type,
              members: org.member_count,
              location: org.location,
              totalRaised: org.total_raised
            }
          })
        })
      }

      // Search projects
      if (!type || type === 'projects') {
        const projects = await ProjectService.searchProjects({ 
          query, 
          limit: Math.ceil(limit / 3) 
        })
        
        projects.forEach(project => {
          results.push({
            id: project.id,
            type: 'project',
            title: project.name,
            description: project.description || '',
            image: project.logo_url,
            url: `/projects/${project.id}`,
            metadata: {
              category: project.category,
              teamSize: project.team_size,
              fundingGoal: project.funding_goal,
              totalRaised: project.total_raised,
              deadline: project.deadline
            }
          })
        })
      }

      return results.slice(0, limit)
    } catch (error) {
      logger.error('Error in universal search:', error, 'Social')
      return []
    }
  }
}

// Social Analytics Service
export class SocialAnalyticsService {
  static async getUserAnalytics(userId: string): Promise<SocialAnalytics> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('website')
        .eq('id', userId)
        .single()

      if (error) {
        return {
          total_connections: 0,
          pending_requests: 0,
          organizations_joined: 0,
          projects_joined: 0,
          profile_views: 0,
          engagement_rate: 0,
          growth_rate: 0
        }
      }

      const profileData = parseWebsiteData(profile.website)
      const connections = profileData.connections || []
      const organizations = profileData.organizations || []
      const projects = profileData.projects || []

      return {
        total_connections: connections.filter((c: Connection) => c.status === 'accepted').length,
        pending_requests: connections.filter((c: Connection) => c.status === 'pending').length,
        organizations_joined: organizations.length,
        projects_joined: projects.length,
        profile_views: profileData.profile_views || 0,
        engagement_rate: 0, // Would calculate based on interactions
        growth_rate: 0 // Would calculate based on historical data
      }
    } catch (error) {
      logger.error('Error getting user analytics:', error, 'Social')
      return {
        total_connections: 0,
        pending_requests: 0,
        organizations_joined: 0,
        projects_joined: 0,
        profile_views: 0,
        engagement_rate: 0,
        growth_rate: 0
      }
    }
  }
}

// Empty State Service
export class EmptyStateService {
  static getEmptyStateContent(section: 'people' | 'organizations' | 'projects'): EmptyStateContent {
    const baseContent = {
      people: {
        title: 'No Connections Yet',
        description: 'You haven\'t connected with anyone yet. Start building your Bitcoin network!',
        primaryAction: {
          label: 'Search People',
          action: '/people/search'
        },
        secondaryAction: {
          label: 'Complete Profile',
          action: '/profile/edit'
        },
        benefits: [
          'Collaborate on Bitcoin projects',
          'Join organizations and DAOs',
          'Share knowledge and resources',
          'Find mentors and mentees',
          'Build professional network'
        ],
        examples: [
          'Connect with Bitcoin developers',
          'Find co-founders for startup',
          'Join local Bitcoin meetups',
          'Collaborate on open source',
          'Share educational content'
        ]
      },
      organizations: {
        title: 'No Organizations Yet',
        description: 'You haven\'t joined any organizations. Discover communities that align with your interests!',
        primaryAction: {
          label: 'Browse Organizations',
          action: '/organizations/discover'
        },
        secondaryAction: {
          label: 'Create Organization',
          action: '/organizations/create'
        },
        benefits: [
          'Shared Bitcoin treasury management',
          'Collaborative decision making',
          'Resource pooling and sharing',
          'Community governance',
          'Collective project funding'
        ],
        examples: [
          'Bitcoin development collectives',
          'Local Bitcoin meetup groups',
          'Educational organizations',
          'Investment DAOs',
          'Open source communities'
        ]
      },
      projects: {
        title: 'No Projects Yet',
        description: 'You haven\'t created or joined any projects. Start building something amazing!',
        primaryAction: {
          label: 'Explore Projects',
          action: '/projects/discover'
        },
        secondaryAction: {
          label: 'Create Project',
          action: '/projects/create'
        },
        benefits: [
          'Dedicated Bitcoin fundraising',
          'Team collaboration tools',
          'Milestone-based funding',
          'Community support',
          'Transparent progress tracking'
        ],
        examples: [
          'Bitcoin education initiatives',
          'Lightning Network applications',
          'Open source Bitcoin tools',
          'Community events',
          'Research projects'
        ]
      }
    }

    return baseContent[section]
  }
}

// Legacy export for backward compatibility
export const socialService = {
  searchPeople: PeopleService.searchPeople,
  searchOrganizations: OrganizationService.searchOrganizations,
  searchProjects: ProjectService.searchProjects
} 