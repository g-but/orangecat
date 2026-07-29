/**
 * Cat Context Tab - Documents list for the Cat hub
 *
 * Inline context management within the Cat page.
 * Users can view, add, and manage their context documents.
 *
 * Created: 2026-01-22
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useEntityList } from '@/hooks/useEntityList';
import { useCatContext } from '@/hooks/useCatContext';
import {
  documentEntityConfig,
  DOCUMENT_TYPE_LABELS,
  type DocumentListItem,
} from '@/config/entities/documents';
import {
  Plus,
  FileText,
  Target,
  Zap,
  Wallet,
  Briefcase,
  Folder,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { CatTrackRecordCard } from '@/components/ai-chat/CatTrackRecordCard';
import { ROUTES } from '@/config/routes';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

const TYPE_ICONS: Record<string, React.ElementType> = {
  goals: Target,
  skills: Zap,
  finances: Wallet,
  business_plan: Briefcase,
  notes: FileText,
  other: Folder,
};

export function CatContextTab() {
  const { user } = useAuth();
  const { summary, isLoading: summaryLoading } = useCatContext();

  const { items: documents, loading: documentsLoading } = useEntityList<DocumentListItem>({
    apiEndpoint: documentEntityConfig.apiEndpoint,
    userId: user?.id,
    limit: 50,
    enabled: !!user?.id,
  });

  const getCompletenessLabel = (score: number) => {
    if (score >= 70) {
      return 'Great context!';
    }
    if (score >= 40) {
      return 'Getting there';
    }
    return 'Just started';
  };

  const getCompletenessColor = (score: number) => {
    // Keep a positive cue once "done well," but a soft mid-band metric
    // doesn't warrant the amber status-warning chroma — the progress bar
    // and verbal label already communicate "not done yet."
    if (score >= 70) {
      return 'text-status-positive';
    }
    return 'text-fg-secondary';
  };

  // Group documents by type
  const documentsByType = documents.reduce(
    (acc, doc) => {
      const type = doc.document_type || 'notes';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(doc);
      return acc;
    },
    {} as Record<string, DocumentListItem[]>
  );

  return (
    <div className="space-y-6">
      {/* Completeness meter */}
      {!summaryLoading && summary && (
        <div className="rounded-md border border-subtle bg-surface-page p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-fg-primary">Context Completeness</h3>
            <span className={`text-sm font-medium ${getCompletenessColor(summary.completeness)}`}>
              {summary.completeness}%
            </span>
          </div>
          <Progress value={summary.completeness} className="h-2 mb-2" />
          <p className="text-xs text-fg-secondary">{getCompletenessLabel(summary.completeness)}</p>

          {/* Tips */}
          {summary.tips.length > 0 && (
            <div className="mt-4 pt-4 border-t border-subtle">
              <p className="text-xs font-medium text-fg-primary mb-2">Tips to improve:</p>
              <ul className="space-y-1">
                {summary.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-fg-secondary flex items-start gap-2">
                    <Plus className="h-3 w-3 text-fg-tertiary flex-shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Outcome feedback loop: what Cat-created entities actually did */}
      <CatTrackRecordCard />

      {/* Add context button */}
      <div className="flex items-center justify-between gap-3 rounded-md border border-subtle bg-surface-raised/30 p-4">
        <div>
          <h3 className="text-sm font-medium text-fg-primary">Improve Cat’s answers</h3>
          <p className="mt-0.5 text-xs text-fg-secondary">
            Add goals, constraints, finances, skills, and plans as private context.
          </p>
        </div>
        <Link
          href={ROUTES.DASHBOARD.DOCUMENTS_CREATE}
          className="inline-flex min-h-11 flex-shrink-0 items-center justify-center gap-2 rounded-md bg-fg-primary px-4 py-2 text-sm font-medium text-fg-inverted transition-colors hover:bg-fg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add
        </Link>
      </div>

      {/* Documents list */}
      {documentsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-fg-tertiary" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-surface-raised">
            <FileText className="h-6 w-6 text-fg-tertiary" />
          </div>
          <h3 className="font-semibold text-fg-primary mb-2">No context yet</h3>
          <p className="text-base text-fg-secondary mb-4">
            Add documents about your goals, skills, and situation to get personalized advice.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(documentsByType).map(([type, docs]) => {
            const Icon = TYPE_ICONS[type] || FileText;
            const label = (DOCUMENT_TYPE_LABELS as Record<string, string>)[type] || type;
            return (
              <div
                key={type}
                className="overflow-hidden rounded-md border border-subtle bg-surface-page"
              >
                <div className="flex items-center gap-2 border-b border-subtle bg-surface-raised/50 px-4 py-3">
                  <Icon className="h-4 w-4 text-fg-secondary" />
                  <span className="text-sm font-medium text-fg-primary">{label}</span>
                  <span className="text-xs text-fg-tertiary ml-auto">{docs.length}</span>
                </div>
                <div className="divide-y divide-fg-tertiary">
                  {docs.map(doc => (
                    <Link
                      key={doc.id}
                      href={`${ENTITY_REGISTRY['document'].basePath}/${doc.id}`}
                      className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-raised"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-medium text-fg-primary truncate">
                          {doc.title}
                        </p>
                        {doc.content && (
                          <p className="text-sm text-fg-secondary truncate mt-0.5">
                            {doc.content.substring(0, 60)}...
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-fg-tertiary flex-shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CatContextTab;
