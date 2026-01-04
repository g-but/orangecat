'use client';

import EntityDashboardPage from '@/components/entity/EntityDashboardPage';
import { aiAssistantEntityConfig } from '@/config/entities/ai-assistants';
import type { AIAssistant } from '@/types/database';

/**
 * AI Assistants Dashboard Page
 *
 * Manage your AI assistants - autonomous AI services you create and monetize.
 *
 * Created: 2025-12-25
 * Last Modified: 2025-01-03
 * Last Modified Summary: Refactored to use reusable EntityDashboardPage component
 */
export default function AIAssistantsDashboardPage() {
  return (
    <EntityDashboardPage<AIAssistant>
      config={aiAssistantEntityConfig}
      title="My AI Assistants"
      description="Build and monetize autonomous AI services powered by your expertise"
      createButtonLabel="Create AI Assistant"
    />
  );
}
