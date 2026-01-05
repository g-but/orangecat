/**
 * @deprecated This file is deprecated. Use @/config/routes.ts instead.
 * 
 * This file re-exports from the unified route configuration for backward compatibility.
 * All route detection logic has been consolidated into src/config/routes.ts
 *
 * Created: 2025-01-27
 * Last Modified: 2026-01-30
 * Last Modified Summary: Deprecated - now re-exports from unified routes.ts
 */

// Re-export from unified route configuration
export {
  ROUTE_CONTEXTS,
  AUTHENTICATED_ROUTES,
  isAuthenticatedRoute,
  getRouteContext,
  type AuthenticatedRoute,
  type RouteContext,
} from './routes';

// Legacy exports for backward compatibility
import { ROUTE_CONTEXTS, isAuthenticatedRoute, type AuthenticatedRoute } from './routes';

export const ROUTES = {
  AUTHENTICATED: ROUTE_CONTEXTS.authenticated,
} as const;
