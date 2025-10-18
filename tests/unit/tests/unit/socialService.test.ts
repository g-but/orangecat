/**
 * SOCIAL SERVICE TESTS
 * 
 * Comprehensive test suite for social collaboration services
 * including People, Organizations, Projects, Search, Analytics, and Empty States
 * 
 * Created: 2025-01-08
 * Last Modified: 2025-01-08
 * Last Modified Summary: Complete test coverage for social networking system
 */

// Mock Supabase client first
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: { website: '{}' }, error: null }),
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null
    })
  }
};

jest.mock('@/services/supabase/client', () => ({
  supabase: mockSupabase
}));

import {
  ProjectService,
  SearchService,
  SocialAnalyticsService,
  EmptyStateService
} from '../socialService';
import { PeopleService } from '../people';
import { OrganizationService } from '../organizations';

import type {
  ConnectionRequest,
  Organization,
  OrganizationFormData,
  Project,
  ProjectFormData,
  SearchFilters,
  SocialAnalytics,
  EmptyStateContent
} from '@/types/social'

describe('PeopleService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('searchPeople', () => {
    it('should search people with default parameters', async () => {
      const mockData = [
        { id: '1', username: 'user1', full_name: 'User One', website: '{}' },
        { id: '2', username: 'user2', full_name: 'User Two', website: '{}' }
      ]
      
      mockSupabase.from().select().limit().range.mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await PeopleService.searchPeople()
      
      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('id', '1')
      expect(result[0]).toHaveProperty('username', 'user1')
    })

    it('should handle search errors gracefully', async () => {
      mockSupabase.from().select().limit().range.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      await expect(PeopleService.searchPeople()).rejects.toThrow('Database error')
    })
  })

  describe('sendConnectionRequest', () => {
    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = {
        recipient_id: 'user-2',
        message: 'Hi!'
      }

      await expect(PeopleService.sendConnectionRequest(request))
        .rejects.toThrow('User not authenticated')
    })
  })

  describe('getConnections', () => {
    it('should return empty array on error', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: new Error('User not found')
      })

      const result = await PeopleService.getConnections('invalid-user')
      
      expect(result).toEqual([])
    })
  })
})

describe('OrganizationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createOrganization', () => {
    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const formData = {
        name: 'Test Org',
        description: 'Test',
        type: 'community' as const,
        visibility: 'public' as const
      }

      await expect(OrganizationService.createOrganization(formData))
        .rejects.toThrow('User not authenticated')
    })
  })

  describe('getUserOrganizations', () => {
    it('should return empty array on error', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: new Error('User not found')
      })

      const result = await OrganizationService.getUserOrganizations('invalid-user')
      
      expect(result).toEqual([])
    })
  })

  describe('searchOrganizations', () => {
    it('should search organizations with filters', async () => {
      const profilesData = [
        { website: '{}' }
      ]

      mockSupabase.from().select().limit.mockResolvedValue({
        data: profilesData,
        error: null
      })

      const filters = {
        query: 'bitcoin',
        limit: 10
      }

      const result = await OrganizationService.searchOrganizations(filters)
      
      expect(Array.isArray(result)).toBe(true)
    })
  })
})

describe('ProjectService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createProject', () => {
    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const formData = {
        name: 'Test Project',
        description: 'Test',
        category: 'development' as const,
        visibility: 'public' as const
      }

      await expect(ProjectService.createProject(formData))
        .rejects.toThrow('User not authenticated')
    })
  })

  describe('getUserProjects', () => {
    it('should return empty array on error', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: new Error('User not found')
      })

      const result = await ProjectService.getUserProjects('invalid-user')
      
      expect(result).toEqual([])
    })
  })

  describe('searchProjects', () => {
    it('should search projects by category', async () => {
      const profilesData = [
        { website: '{}' }
      ]

      mockSupabase.from().select().limit.mockResolvedValue({
        data: profilesData,
        error: null
      })

      const filters = {
        category: 'education'
      }

      const result = await ProjectService.searchProjects(filters)
      
      expect(Array.isArray(result)).toBe(true)
    })
  })
})

describe('SearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('universalSearch', () => {
    it('should handle search errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Search failed');
      });

      const result = await SearchService.universalSearch({ query: 'test' });

      expect(result).toEqual([]);
    });
  });
})

describe('SocialAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserAnalytics', () => {
    it('should return default analytics on error', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Analytics failed');
      });
      
      const result = await SocialAnalyticsService.getUserAnalytics('invalid-user');

      expect(result).toHaveProperty('total_connections', 0);
      expect(result).toHaveProperty('pending_requests', 0)
      expect(result).toHaveProperty('organizations_joined', 0)
      expect(result).toHaveProperty('projects_joined', 0)
    })
  })
})

describe('EmptyStateService', () => {
  describe('getEmptyStateContent', () => {
    it('should return people empty state content', () => {
      const content = EmptyStateService.getEmptyStateContent('people')
      
      expect(content).toHaveProperty('title', 'No Connections Yet')
      expect(content).toHaveProperty('description')
      expect(content).toHaveProperty('primaryAction')
      expect(content).toHaveProperty('benefits')
      expect(content).toHaveProperty('examples')
      expect(content.benefits).toContain('Collaborate on Bitcoin projects')
    })

    it('should return organizations empty state content', () => {
      const content = EmptyStateService.getEmptyStateContent('organizations')
      
      expect(content).toHaveProperty('title', 'No Organizations Yet')
      expect(content.benefits).toContain('Shared Bitcoin treasury management')
      expect(content.examples).toContain('Bitcoin development collectives')
    })

    it('should return projects empty state content', () => {
      const content = EmptyStateService.getEmptyStateContent('projects')
      
      expect(content).toHaveProperty('title', 'No Projects Yet')
      expect(content.benefits).toContain('Dedicated Bitcoin fundraising')
      expect(content.examples).toContain('Bitcoin education initiatives')
    })
  })
})

// Integration Tests
describe('Social Collaboration Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle error scenarios gracefully', async () => {
    // Test database connection failure
    mockSupabase.from.mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    await expect(PeopleService.searchPeople()).rejects.toThrow('Database connection failed');

    // Test authentication failure
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Authentication failed')
    })

    await expect(PeopleService.sendConnectionRequest({
      recipient_id: 'user-2',
      message: 'Hello'
    })).rejects.toThrow('User not authenticated')
  })
})

// Security Tests
describe('Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should require authentication for sensitive operations', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    // All these operations should require authentication
    await expect(PeopleService.sendConnectionRequest({
      recipient_id: 'user-2',
      message: 'Hello'
    })).rejects.toThrow('User not authenticated')

    await expect(OrganizationService.createOrganization({
      name: 'Test Org',
      description: 'Test',
      type: 'community',
      visibility: 'public'
    })).rejects.toThrow('User not authenticated')

    await expect(ProjectService.createProject({
      name: 'Test Project',
      description: 'Test',
      category: 'development',
      visibility: 'public'
    })).rejects.toThrow('User not authenticated')
  })
}) 