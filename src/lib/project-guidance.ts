/**
 * Project Field Guidance Content
 *
 * LEGACY COMPATIBILITY LAYER
 *
 * This file re-exports from the consolidated entity-guidance system.
 * New code should import directly from '@/lib/entity-guidance'.
 *
 * Created: 2025-11-24
 * Last Modified: 2025-12-16
 * Last Modified Summary: Converted to re-export layer for backward compatibility
 */

import React from 'react';
import { Heart, Users, Shield } from 'lucide-react';

// Re-export the canonical guidance content
export {
  projectGuidanceContent,
  projectDefaultGuidance,
  type ProjectFieldType,
} from '@/lib/entity-guidance/project-guidance';

// Legacy type aliases for backward compatibility
// New code should use GuidanceContent and DefaultGuidance from '@/components/create/types'
export interface FieldGuidanceContent {
  icon: React.ReactNode;
  title: string;
  description: string;
  tips: string[];
  examples?: string[];
}

export interface DefaultContent {
  title: string;
  description: string;
  features: Array<{
    icon: React.ReactNode;
    text: string;
  }>;
  hint?: string;
}

// Legacy alias - use projectDefaultGuidance in new code
export const projectDefaultContent: DefaultContent = {
  title: "What's a Project?",
  description:
    'A project is any initiative that needs funding — from personal goals to community causes. Accept Bitcoin donations directly to your wallet.',
  features: [
    {
      icon: React.createElement(Heart, { className: 'w-4 h-4 text-orange-600' }),
      text: 'Accept Bitcoin donations instantly',
    },
    {
      icon: React.createElement(Users, { className: 'w-4 h-4 text-orange-600' }),
      text: 'Rally supporters and share updates',
    },
    {
      icon: React.createElement(Shield, { className: 'w-4 h-4 text-orange-600' }),
      text: 'Transparent and self-custodial by design',
    },
  ],
  hint: '💡 Click on any field to get specific guidance',
};



