/**
 * Route Constants
 *
 * Centralized route definitions to ensure consistency across the application.
 * Always use these constants instead of hardcoded strings.
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  AUTH: '/auth',
  DISCOVER: '/discover',
  STUDY_BITCOIN: '/study-bitcoin',

  // Project routes
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects/create',
    VIEW: (id: string) => `/projects/${id}`,
    EDIT: (id: string) => `/project/${id}/edit`, // Note: edit route uses singular /project/
  },

  // Dashboard routes
  DASHBOARD: {
    HOME: '/dashboard',
    PROJECTS: '/dashboard/projects',
    ANALYTICS: '/dashboard/analytics',
  },

  // Profile routes
  PROFILE: {
    VIEW: (username: string) => `/profile/${username}`,
    SETTINGS: '/profile/settings',
  },
} as const;

/**
 * Legacy routes that redirect to new routes
 */
export const LEGACY_ROUTES = {
  CREATE: '/create', // Redirects to /projects/create
} as const;
