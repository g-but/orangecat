/**
 * Dashboard Sections - Modular components extracted from dashboard page
 *
 * These components follow the modularity principle:
 * - Each section handles one responsibility
 * - Uses ENTITY_REGISTRY for routes (no hardcoded strings)
 * - Reusable and testable
 */

export { DashboardHeader } from './DashboardHeader';
export { DashboardWelcome } from './DashboardWelcome';
export { DashboardInviteCTA } from './DashboardInviteCTA';
export { DashboardJourney } from './DashboardJourney';
export { DashboardQuickActions } from './DashboardQuickActions';
export { DashboardProjects } from './DashboardProjects';
