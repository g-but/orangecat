/**
 * INITIATIVES INDEX - MVP
 *
 * Created: 2025-01-09
 * Last Modified: 2025-01-24
 * Last Modified Summary: Simplified to MVP scope - only projects and fundraising
 */

import type { LucideIcon } from 'lucide-react';
import type { Initiative } from '@/types/initiative';
import { ICON_MAP } from './icons';

// Import MVP initiative modules - only projects and fundraising
import { projects } from './projects';
import { fundraising } from './fundraising';

// Export all initiatives in a single record - MVP
export const INITIATIVES: Record<string, Initiative> = {
  projects,
  fundraising,
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
