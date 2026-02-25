'use client';

import EntityDashboardPage from '@/components/entity/EntityDashboardPage';
import { documentEntityConfig, type DocumentListItem } from '@/config/entities/documents';
import { Cat } from 'lucide-react';

/**
 * Documents Dashboard Page
 *
 * Manage documents that provide context for My Cat AI assistant.
 *
 * Created: 2026-01-20
 * Last Modified: 2026-02-24
 * Last Modified Summary: Migrated to EntityDashboardPage for consistent UX (adds delete, error handling, bulk selection)
 */

function MyCatInfoBanner() {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-100 rounded-full">
          <Cat className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-medium text-indigo-900">Help My Cat help you</h3>
          <p className="text-sm text-indigo-700 mt-1">
            The more context you provide, the better advice My Cat can give. Add documents about
            your goals, skills, financial situation, or business plans. Only documents marked{' '}
            <span className="font-medium">&ldquo;My Cat Only&rdquo;</span> or{' '}
            <span className="font-medium">&ldquo;Public&rdquo;</span> will be visible to My Cat.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <EntityDashboardPage<DocumentListItem>
      config={documentEntityConfig}
      title="My Cat Context"
      description="Add documents to help My Cat understand your goals, skills, and situation"
      createButtonLabel="Add Context"
      headerContent={<MyCatInfoBanner />}
    />
  );
}
