/**
 * Cat Context Tab - Documents list for the Cat hub
 *
 * Inline context management within the Cat page.
 * Users can view, add, and manage their context documents.
 *
 * Created: 2026-01-22
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useEntityList } from '@/hooks/useEntityList';
import { documentEntityConfig, type DocumentListItem } from '@/config/entities/documents';
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

const TYPE_ICONS: Record<string, React.ElementType> = {
  goals: Target,
  skills: Zap,
  finances: Wallet,
  business_plan: Briefcase,
  notes: FileText,
  other: Folder,
};

const TYPE_LABELS: Record<string, string> = {
  goals: 'Goals & Aspirations',
  skills: 'Skills & Expertise',
  finances: 'Financial Info',
  business_plan: 'Business Plan',
  notes: 'Notes',
  other: 'Other',
};

interface ContextSummary {
  completeness: number;
  knowledgeItems: {
    category: string;
    icon: string;
    items: string[];
    count: number;
  }[];
  tips: string[];
}

export function CatContextTab() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ContextSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const { items: documents, loading: documentsLoading } = useEntityList<DocumentListItem>({
    apiEndpoint: documentEntityConfig.apiEndpoint,
    userId: user?.id,
    limit: 50,
    enabled: !!user?.id,
  });

  // Fetch context summary
  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch('/api/cat/context');
        const data = await res.json();
        if (data.success) {
          setSummary(data.data);
        }
      } catch {
        // Ignore errors
      } finally {
        setSummaryLoading(false);
      }
    }
    if (user) {
      fetchSummary();
    }
  }, [user]);

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
    if (score >= 70) {
      return 'text-green-600';
    }
    if (score >= 40) {
      return 'text-amber-600';
    }
    return 'text-gray-500';
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
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Context Completeness</h3>
            <span className={`text-sm font-medium ${getCompletenessColor(summary.completeness)}`}>
              {summary.completeness}%
            </span>
          </div>
          <Progress value={summary.completeness} className="h-2 mb-2" />
          <p className="text-xs text-gray-500">{getCompletenessLabel(summary.completeness)}</p>

          {/* Tips */}
          {summary.tips.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-700 mb-2">Tips to improve:</p>
              <ul className="space-y-1">
                {summary.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
                    <Plus className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Add context button */}
      <Link
        href="/dashboard/documents/create"
        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
      >
        <Plus className="h-5 w-5" />
        <span className="font-medium">Add Context</span>
      </Link>

      {/* Documents list */}
      {documentsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">No context yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add documents about your goals, skills, and situation to get personalized advice.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(documentsByType).map(([type, docs]) => {
            const Icon = TYPE_ICONS[type] || FileText;
            const label = TYPE_LABELS[type] || type;
            return (
              <div
                key={type}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <span className="text-xs text-gray-400 ml-auto">{docs.length}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {docs.map(doc => (
                    <Link
                      key={doc.id}
                      href={`/dashboard/documents/${doc.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                        {doc.content && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {doc.content.substring(0, 60)}...
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
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
