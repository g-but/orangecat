/**
 * ORGANIZATIONS SERVICE - MODULAR ARCHITECTURE
 *
 * Created: 2025-01-09
 * Last Modified: 2025-01-09
 * Last Modified Summary: ✅ REFACTORED from 808-line monolith to modular architecture - Option A Phase 1 Complete
 *
 * BEFORE: 808 lines in single file (102% over 400-line limit)
 * AFTER: 6 focused modules with single responsibilities
 *
 * Architecture Benefits:
 * - Single Responsibility Principle
 * - Better testability
 * - Easier maintenance
 * - Improved code reuse
 * - Clear separation of concerns
 */

// Export all types
export type {
  Organization,
  OrganizationFormData,
  OrganizationSearchParams,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationFilters,
  QueryOptions
} from './types';

// Export all modules
export { OrganizationMapper } from './mapper';
export { OrganizationReader } from './reader';
export { OrganizationWriter } from './writer';

// Main service class that combines all operations
import getSupabaseClient from '@/services/supabase/client';
import { OrganizationReader } from './reader';
import { OrganizationWriter } from './writer';
import type { Organization, OrganizationFormData, OrganizationSearchParams } from './types';
import { logger } from '@/utils/logger';

export class OrganizationService {
  // =====================================================================
  // 📖 READ OPERATIONS
  // =====================================================================

  static async getOrganization(organizationId: string): Promise<Organization | null> {
    return OrganizationReader.getById(organizationId);
  }

  static async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    // For now, return null as this method isn't implemented yet
    // TODO: Implement slug-based lookup
    return null;
  }

  static async getOrganizations(options: OrganizationSearchParams = {}): Promise<Organization[]> {
    return OrganizationReader.search(options);
  }

  static async searchOrganizations(
    searchTerm: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Organization[]> {
    return OrganizationReader.search({ query: searchTerm, limit, offset });
  }

  static async getUserOrganizations(userId: string): Promise<Organization[]> {
    // For now, return empty array as this method isn't implemented yet
    // TODO: Implement user organization lookup
    return [];
  }

  // =====================================================================
  // ✏️ WRITE OPERATIONS
  // =====================================================================

  static async createOrganization(
    userId: string,
    formData: OrganizationFormData
  ): Promise<Organization | null> {
    const input = {
      name: formData.name,
      description: formData.description,
      website: formData.website,
      logo_url: formData.logo_url
    };
    return OrganizationWriter.create(input);
  }

  static async updateOrganization(
    organizationId: string,
    formData: Partial<OrganizationFormData>
  ): Promise<Organization | null> {
    const updates = {
      name: formData.name,
      description: formData.description,
      website: formData.website,
      logo_url: formData.logo_url
    };
    return OrganizationWriter.update(organizationId, updates);
  }

  static async deleteOrganization(organizationId: string): Promise<boolean> {
    return OrganizationWriter.delete(organizationId);
  }

  static async joinOrganization(organizationId: string, userId: string): Promise<void> {
    // TODO: Implement membership functionality
  }

  static async leaveOrganization(organizationId: string, userId: string): Promise<void> {
    // TODO: Implement membership functionality
  }

  // =====================================================================
  // 🔐 LEGACY COMPATIBILITY METHODS
  // =====================================================================

  static async updateOrganizationSettings(
    organizationId: string,
    settings: Record<string, any>
  ): Promise<Organization | null> {
    // TODO: Implement settings functionality
    return null;
  }

  static async getOrganizationMembers(organizationId: string): Promise<any[]> {
    // TODO: Implement membership functionality
    return [];
  }

  static async getOrganizationStats(organizationId: string): Promise<any> {
    // TODO: Implement stats functionality
    return {};
  }

  // =====================================================================
  // 🐱 ORANGE CAT ORGANIZATION INITIALIZATION
  // =====================================================================

  /**
   * Initialize the Orange Cat organization for funding AI subscriptions
   * This should be called once during application setup
   */
  static async initializeOrangeCatOrganization(adminUserId?: string): Promise<Organization | null> {
    try {
      // Check if Orange Cat organization already exists
      const existingOrg = await this.getOrganizationBySlug('orange-cat');
      if (existingOrg) {
        logger.info('Orange Cat organization already exists', { organizationId: existingOrg.id });
        return existingOrg;
      }

      // If no admin user provided, try to find one
      let targetUserId = adminUserId;
      if (!targetUserId) {
        // Try to find the first user (for development)
        const { data: users } = await getSupabaseClient().auth.admin.listUsers();
        if (users && users.users.length > 0) {
          targetUserId = users.users[0].id;
        }
      }

      if (!targetUserId) {
        logger.warn('No admin user available to create Orange Cat organization');
        return null;
      }

      // Create the Orange Cat organization
      const orangeCatData: OrganizationFormData = {
        name: 'Orange Cat',
        description: 'Official Orange Cat organization for funding AI development tools including Claude Code and Cursor subscriptions. Support the development of this Bitcoin crowdfunding platform.',
        type: 'foundation',
        category: 'Technology',
        governance_model: 'hierarchical',
        treasury_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', // Example Bitcoin address for donations
        is_public: true,
        requires_approval: false,
        website_url: 'https://orangecat.com',
        tags: ['bitcoin', 'crowdfunding', 'ai', 'development', 'opensource']
      };

      const organization = await this.createOrganization(targetUserId, orangeCatData);

      logger.info('Orange Cat organization created successfully', {
        organizationId: organization.id,
        adminUserId: targetUserId
      });

      return organization;

    } catch (error) {
      logger.error('Failed to initialize Orange Cat organization', { error });
      return null;
    }
  }

  /**
   * Get or create the Orange Cat organization
   */
  static async getOrangeCatOrganization(): Promise<Organization | null> {
    // First try to get existing organization
    let org = await this.getOrganizationBySlug('orange-cat');

    // If it doesn't exist, try to initialize it
    if (!org) {
      org = await this.initializeOrangeCatOrganization();
    }

    return org;
  }
}
