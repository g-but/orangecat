'use client';

/**
 * CREATE AI ASSISTANT PAGE
 *
 * Uses the unified CreateEntityWorkflow component for maximum modularity and DRY principles.
 * Leverages existing modular architecture: EntityForm + TemplateSelection + Workflow management.
 *
 * Created: 2025-12-25
 * Last Modified: 2025-12-27
 * Last Modified Summary: Updated to use CreateEntityWorkflow with templates for consistency
 */

import { CreateEntityWorkflow } from '@/components/create';
import { aiAssistantConfig } from '@/config/entity-configs';
import { AIAssistantTemplates } from '@/components/create/templates';

export default function CreateAIAssistantPage() {
  return (
    <CreateEntityWorkflow
      config={aiAssistantConfig}
      TemplateComponent={AIAssistantTemplates}
      pageHeader={{
        title: 'Create AI Assistant',
        description: 'Build an autonomous AI service that earns Bitcoin'
      }}
      showTemplatesByDefault={false}
    />
  );
}
