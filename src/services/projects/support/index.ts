/**
 * Project Support Service - Main Orchestrator
 *
 * Unified service for project support operations.
 * Re-exports all functionality from modular sub-modules.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created main orchestrator
 */

// Re-export types
export * from './types';

// Re-export constants
export * from './constants';

// Re-export queries
export * from './queries';

// Re-export mutations
export * from './mutations';

// Re-export validation
export * from './validation';

// Re-export helpers
export * from './helpers';

/**
 * ProjectSupportService Class (for backward compatibility)
 *
 * Provides a class-based interface.
 * Internally uses the modular functions.
 */
class ProjectSupportService {
  // Queries
  async getProjectSupportStats(projectId: string) {
    return import('./queries').then((m) => m.getProjectSupportStats(projectId));
  }

  async getProjectSupport(
    projectId: string,
    filters?: Parameters<typeof import('./queries').getProjectSupport>[1],
    pagination?: Parameters<typeof import('./queries').getProjectSupport>[2]
  ) {
    return import('./queries').then((m) => m.getProjectSupport(projectId, filters, pagination));
  }

  async hasUserSupported(
    projectId: string,
    userId: string,
    supportType?: string
  ) {
    return import('./queries').then((m) => m.hasUserSupported(projectId, userId, supportType));
  }

  // Mutations
  async createProjectSupport(
    projectId: string,
    request: Parameters<typeof import('./mutations').createProjectSupport>[1]
  ) {
    return import('./mutations').then((m) => m.createProjectSupport(projectId, request));
  }

  async deleteProjectSupport(supportId: string) {
    return import('./mutations').then((m) => m.deleteProjectSupport(supportId));
  }
}

// Export singleton instance
const projectSupportService = new ProjectSupportService();
export default projectSupportService;


