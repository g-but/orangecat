'use client';

/**
 * CREATE CIRCLE PAGE
 *
 * Uses the unified EntityForm component for consistent UX.
 * Includes contextual guidance sidebar.
 *
 * Created: 2025-12-04
 * Last Modified: 2025-12-04
 * Last Modified Summary: Initial unified circle creation page
 */

import { EntityForm } from '@/components/create';
import { circleConfig } from '@/config/entity-configs';

export default function CreateCirclePage() {
  return <EntityForm config={circleConfig} />;
}



















