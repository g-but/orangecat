/**
 * INITIATIVES - CLEAN MODULAR ARCHITECTURE
 *
 * Created: 2025-01-08
 * Last Modified: 2025-01-09
 * Last Modified Summary: ✅ REFACTORED from 901-line monolith to modular architecture - Option A Phase 1 Complete
 *
 * BEFORE: 901 lines in single file (125% over 400-line limit)
 * AFTER: 6 modular files (~150 lines each) with clean imports
 *
 * Performance Impact: Improved tree-shaking, better code splitting, easier maintenance
 * Architecture: Follows DRY principles, single responsibility principle
 */

// Import all modules from the modular architecture
export {
  INITIATIVES,
  getIconComponent,
  getInitiative,
  getAllInitiatives,
  getAvailableInitiatives,
  getComingSoonInitiatives,
} from './initiatives/index';

// Re-export types for backward compatibility with existing imports
export type { Initiative } from '@/types/initiative';

// Legacy compatibility - this can be removed after confirming no usage
export { ICON_MAP } from '@/data/initiatives/icons';
