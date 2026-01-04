/**
 * SOCIAL COLLABORATION SERVICES - UPDATED FOR PROPER DATABASE IMPLEMENTATION
 * 
 * This service now properly interfaces with database tables instead of
 * storing data as JSON in profiles.website
 * 
 * Created: 2025-01-08
 * Last Modified: 2026-01-03
 * Last Modified Summary: Removed @ts-nocheck and fixed type safety
 */

import { supabase } from '@/lib/supabase/browser'
import { logger } from '@/utils/logger'
import type { SearchResult, SearchFilters, EmptyStateContent, ScalableProfile, Organization } from '@/types/social'

// Import proper database services
import { OrganizationService } from './organizations/index'
import { PeopleService } from './people/index'
// Re-export so tests can import directly
export { PeopleService, OrganizationService }
import { BitcoinCollaborationService } from './bitcoin/collaborations'

// Re-export types
export type { 
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
  ActivityFeed,
  BitcoinCollaboration,
  CollaborationFormData,
  CollaborationPayment
} from '@/types/social'

// =====================================================================
// 🔄 UPDATED SERVICE EXPORTS - USING PROPER DATABASE IMPLEMENTATION
// =====================================================================

// Re-export properly implemented services
// Re-export so tests can import directly
export { PeopleService } from './people/index'
export { OrganizationService } from './organizations/index'
export { BitcoinCollaborationService } from './bitcoin/collaborations'

// =====================================================================
// 🔍 SEARCH SERVICE - UPDATED FOR DATABASE QUERIES
// =====================================================================

export class SearchService {
  static async universalSearch(filters: SearchFilters): Promise<SearchResult[]> {
    try {
      const { query, type, limit = 20, offset = 0 } = filters
      const results: SearchResult[] = []

      // Search people using proper database service
      if (!type || type === 'people') {
        const people = await PeopleService.searchPeople({ 
          query, 
          limit: Math.ceil(limit / 3),
          offset 
        })
        
        people.forEach(person => {
          const result: SearchResult = {
            type: 'person',
            id: person.id,
            title: person.name || person.username || '',
            description: person.bio || '',
            image_url: person.avatar_url || undefined,
            verification_status: person.verification_status || undefined,
            location: person.location || undefined,
            created_at: person.created_at || new Date().toISOString(),
            data: person as ScalableProfile,
          }
          results.push(result)
        })
      }

      // Search organizations using proper database service
      if (!type || type === 'organizations') {
        const organizations = await OrganizationService.searchOrganizations({ 
          query, 
          limit: Math.ceil(limit / 3),
          offset 
        })
        
        organizations.forEach(org => {
          const result: SearchResult = {
            type: 'organization',
            id: org.id,
            title: org.name,
            description: org.description || '',
            image_url: org.logo_url || undefined,
            member_count: org.member_count,
            location: org.location || undefined,
            created_at: org.created_at || new Date().toISOString(),
            data: org as Organization,
          }
          results.push(result)
        })
      }

      // Projects are the unified entity - search handled above

      return results.slice(0, limit)
    } catch (error) {
      logger.error('Error in universal search', { error }, 'Social')
      return []
    }
  }
}

// =====================================================================
// 📊 ANALYTICS SERVICE - UPDATED FOR DATABASE QUERIES
// =====================================================================

export class SocialAnalyticsService {
  static async getUserAnalytics(userId: string): Promise<SocialAnalytics> {
    try {
      // Use proper database service for analytics
      return await PeopleService.getUserAnalytics(userId)
    } catch (error) {
      logger.error('Error getting user analytics', { error, userId }, 'Social')
      return {
        total_connections: 0,
        pending_requests: 0,
        organizations_joined: 0,
        organizations_created: 0,
        projects_created: 0,
        projects_supported: 0,
        engagement_rate: 0,
        growth_rate: 0
      }
    }
  }
}

// Projects are the unified entity for simplified MVP architecture

// =====================================================================
// 💡 EMPTY STATE SERVICE - UPDATED CONTENT
// =====================================================================

export class EmptyStateService {
  static getEmptyStateContent(section: 'people' | 'organizations' | 'projects'): EmptyStateContent {
    const baseContent: Record<'people' | 'organizations' | 'projects', EmptyStateContent> = {
      people: {
        title: 'No Connections Yet',
        description: "You haven't connected with anyone yet. Start building your network!",
        primaryAction: {
          label: 'Search People',
          action: '/people/search'
        },
        secondaryAction: {
          label: 'Complete Profile',
          action: '/profile/edit'
        },
        benefits: [
          'Collaborate on projects',
          'Join organizations and communities',
          'Share knowledge and resources',
          'Find mentors and mentees',
          'Build professional network'
        ],
        examples: [
          'Connect with like-minded creators',
          'Find co-founders for projects',
          'Join local community groups',
          'Collaborate on initiatives',
          'Share educational content'
        ]
      },
      organizations: {
        title: 'No Organizations Yet',
        description: "You haven't joined any organizations. Discover communities that align with your interests!",
        primaryAction: {
          label: 'Browse Organizations',
          action: '/organizations/discover'
        },
        secondaryAction: {
          label: 'Create Organization',
          action: '/organizations/create'
        },
        benefits: [
          'Shared treasury management',
          'Collaborative decision making',
          'Resource pooling and sharing',
          'Community governance',
          'Collective project funding'
        ],
        examples: [
          'Local community groups',
          'Arts and culture collectives',
          'Educational organizations',
          'Environmental initiatives',
          'Creative communities'
        ]
      },
      projects: {
        title: 'No Projects Yet',
        description: "You haven't created or joined any projects yet. Start building something amazing!",
        primaryAction: {
          label: 'Create Project',
          action: '/projects/create'
        },
        secondaryAction: {
          label: 'Browse Projects',
          action: '/projects'
        },
        benefits: [
          'Crowdfund your ideas',
          'Collaborate with others',
          'Track progress and milestones',
          'Receive Bitcoin payments',
          'Build your portfolio'
        ],
        examples: [
          'Creative projects',
          'Community initiatives',
          'Open source software',
          'Educational content',
          'Social impact campaigns'
        ]
      }
    };

    return baseContent[section];
  }
}

// =====================================================================
// 🔄 LEGACY COMPATIBILITY
// =====================================================================

// Legacy export for backward compatibility
export const socialService = {
  // Use proper database services
  searchPeople: PeopleService.searchPeople,
  searchOrganizations: OrganizationService.searchOrganizations,
  searchProjects: SearchService.universalSearch.bind(SearchService),

  // Connection methods
  sendConnectionRequest: PeopleService.sendConnectionRequest,
  getConnections: PeopleService.getConnections,
  respondToConnection: PeopleService.respondToConnection,

  // Organization methods
  createOrganization: OrganizationService.createOrganization,
  getUserOrganizations: OrganizationService.getUserOrganizations,
  joinOrganization: OrganizationService.joinOrganization,

  // Bitcoin collaboration methods
  createCollaboration: BitcoinCollaborationService.createCollaboration,
  getUserCollaborations: BitcoinCollaborationService.getUserCollaborations,
  recordPayment: BitcoinCollaborationService.recordPayment,

  // Analytics
  getUserAnalytics: SocialAnalyticsService.getUserAnalytics,

  // Search
  universalSearch: SearchService.universalSearch
} 

// For unit-tests – expose concrete implementations
// Already exported above or as classes within this file
export { SearchService };
export { SocialAnalyticsService };
