'use client';

import EntityDashboardPage from '@/components/entity/EntityDashboardPage';
import { aiAssistantEntityConfig } from '@/config/entities/ai-assistants';
import { AICreditsPanel } from '@/components/ai/AICreditsPanel';
import { AIRevenuePanel } from '@/components/ai/AIRevenuePanel';
import type { AIAssistant } from '@/types/database';

/**
 * AI Assistants Dashboard Page
 *
 * Manage your AI assistants - autonomous AI services you create and monetize.
 * Includes credits panel for managing your AI credits balance.
 *
 * Created: 2025-12-25
 * Last Modified: 2026-01-21
 * Last Modified Summary: Added AI Credits panel sidebar
 */
export default function AIAssistantsDashboardPage() {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main content - AI Assistants list */}
      <div className="flex-1 min-w-0">
        <EntityDashboardPage<AIAssistant>
          config={aiAssistantEntityConfig}
          title="My AI Assistants"
          description="Build and monetize autonomous AI services powered by your expertise"
          createButtonLabel="Create AI Assistant"
        />
      </div>

      {/* Sidebar - Credits and Revenue panels */}
      <div className="lg:w-80 flex-shrink-0">
        <div className="lg:sticky lg:top-4 space-y-4">
          <AICreditsPanel />
          <AIRevenuePanel />
        </div>
      </div>
    </div>
  );
}
