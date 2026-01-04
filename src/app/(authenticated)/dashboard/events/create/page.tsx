'use client';

/**
 * CREATE EVENT PAGE
 *
 * Uses the unified CreateEntityWorkflow component for maximum modularity and DRY principles.
 * Leverages existing modular architecture: EntityForm + TemplateSelection + Workflow management.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Moved to /dashboard/events/create and added showTemplatesByDefault={false}
 */

import { CreateEntityWorkflow } from '@/components/create';
import { eventConfig } from '@/config/entity-configs';
import { EventTemplates } from '@/components/create/templates';

export default function CreateEventPage() {
  return (
    <CreateEntityWorkflow
      config={eventConfig}
      TemplateComponent={EventTemplates}
      pageHeader={{
        title: 'Create Event',
        description: 'Organize an in-person gathering or meetup with Bitcoin-powered ticketing.'
      }}
      showTemplatesByDefault={false}
    />
  );
}
