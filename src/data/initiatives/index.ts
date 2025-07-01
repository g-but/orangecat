/**
 * INITIATIVES INDEX - MODULAR ARCHITECTURE
 * 
 * Created: 2025-01-09
 * Last Modified: 2025-01-09
 * Last Modified Summary: Refactored from 901-line monolith to modular architecture
 */

import type { LucideIcon } from 'lucide-react';
import type { Initiative } from '@/types/initiative';
import { ICON_MAP } from './icons';

// Import all initiative modules
import { organizations } from './organizations';
import { events } from './events';
import { projects } from './projects';
import { people } from './people';
import { assets } from './assets';
import { fundraising } from './fundraising';

// Export all initiatives in a single record
export const INITIATIVES: Record<string, Initiative> = {
  organizations,
  events,
  projects, 
  people,
  assets,
  fundraising
};

// Re-export types for backward compatibility
export type { Initiative } from '@/types/initiative';

// Utility functions
export const getIconComponent = (iconName: string): LucideIcon => {
  return ICON_MAP[iconName as keyof typeof ICON_MAP] || ICON_MAP.Building;
};

export const getInitiative = (id: string): Initiative | undefined => {
  return INITIATIVES[id];
};

export const getAllInitiatives = (): Initiative[] => {
  return Object.values(INITIATIVES);
};

export const getAvailableInitiatives = (): Initiative[] => {
  return Object.values(INITIATIVES).filter(initiative => initiative.status === 'available');
};

export const getComingSoonInitiatives = (): Initiative[] => {
  return Object.values(INITIATIVES).filter(initiative => initiative.status === 'coming-soon');
}; 