/**
 * Cat Context Panel - "What My Cat Knows About You"
 *
 * A transparency panel showing users what context My Cat has access to,
 * with personalized greeting, knowledge summary, smart suggestions,
 * and a completeness meter.
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Initial implementation
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Cat,
  User,
  Target,
  Zap,
  Wallet,
  Briefcase,
  FileText,
  Folder,
  Package,
  Rocket,
  Heart,
  Calendar,
  ChevronRight,
  Plus,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface KnowledgeItem {
  category: string;
  icon: string;
  items: string[];
  count: number;
}

interface Suggestion {
  text: string;
  action?: string;
  actionUrl?: string;
}

interface ContextSummary {
  greeting: string;
  knowledgeItems: KnowledgeItem[];
  suggestions: Suggestion[];
  completeness: number;
  tips: string[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  user: User,
  target: Target,
  zap: Zap,
  wallet: Wallet,
  briefcase: Briefcase,
  'file-text': FileText,
  folder: Folder,
  package: Package,
  rocket: Rocket,
  heart: Heart,
  calendar: Calendar,
};

function getIcon(iconName: string): React.ElementType {
  return ICON_MAP[iconName] || FileText;
}

function _getCompletenessColor(score: number): string {
  if (score >= 70) {
    return 'bg-green-500';
  }
  if (score >= 40) {
    return 'bg-amber-500';
  }
  return 'bg-red-400';
}

function getCompletenessLabel(score: number): string {
  if (score >= 70) {
    return 'Great context!';
  }
  if (score >= 40) {
    return 'Getting there';
  }
  return 'Just started';
}

interface CatContextPanelProps {
  className?: string;
  showGreeting?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function CatContextPanel({
  className = '',
  showGreeting = true,
  collapsed = false,
  onToggle,
}: CatContextPanelProps) {
  const [context, setContext] = useState<ContextSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cat/context');
      if (!res.ok) {
        throw new Error('Failed to fetch context');
      }
      const data = await res.json();
      if (data.success && data.data) {
        setContext(data.data);
      } else {
        throw new Error(data.error || 'Failed to load context');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContext();
  }, []);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-200 rounded-full" />
            <div className="h-6 bg-gray-200 rounded w-48" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-2 bg-gray-200 rounded w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
        <button
          onClick={fetchContext}
          className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  if (!context) {
    return null;
  }

  // Collapsed view
  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow w-full text-left ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <Cat className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">What My Cat Knows</h3>
              <p className="text-xs text-gray-500">
                {context.completeness}% complete • {context.knowledgeItems.length} categories
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </button>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header with greeting */}
      {showGreeting && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Cat className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-lg leading-snug">{context.greeting}</p>
            </div>
          </div>
        </div>
      )}

      {/* Completeness meter */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Context Completeness</span>
          <span className="text-sm text-gray-500">{context.completeness}%</span>
        </div>
        <Progress value={context.completeness} className="h-2" />
        <p className="text-xs text-gray-500 mt-1.5">{getCompletenessLabel(context.completeness)}</p>
      </div>

      {/* Knowledge items */}
      {context.knowledgeItems.length > 0 && (
        <div className="px-5 py-4 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">What I know about you</h4>
          <div className="space-y-3">
            {context.knowledgeItems.map((item, idx) => {
              const Icon = getIcon(item.icon);
              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className="p-1.5 bg-gray-100 rounded-lg flex-shrink-0">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{item.category}</span>
                      {item.count > item.items.length && (
                        <span className="text-xs text-gray-400">
                          +{item.count - item.items.length} more
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">
                      {item.items.slice(0, 3).map((text, i) => (
                        <span key={i} className="text-xs text-gray-500 block truncate">
                          {text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {context.suggestions.length > 0 && (
        <div className="px-5 py-4 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Suggestions
          </h4>
          <div className="space-y-2">
            {context.suggestions.map((suggestion, idx) => (
              <div key={idx} className="text-sm">
                {suggestion.actionUrl ? (
                  <Link
                    href={suggestion.actionUrl}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-gray-700">{suggestion.text}</p>
                    {suggestion.action && (
                      <span className="text-indigo-600 text-xs font-medium mt-1 flex items-center gap-1">
                        {suggestion.action} <ChevronRight className="h-3 w-3" />
                      </span>
                    )}
                  </Link>
                ) : (
                  <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                    <p className="text-gray-700">{suggestion.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips for improving */}
      {context.tips.length > 0 && (
        <div className="px-5 py-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Tips to improve</h4>
          <ul className="space-y-2">
            {context.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <Plus className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/documents/create"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add More Context
          </Link>
        </div>
      )}

      {/* Empty state - no knowledge yet */}
      {context.knowledgeItems.length === 0 && (
        <div className="px-5 py-8 text-center">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <FileText className="h-6 w-6 text-gray-400" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">I don't know much about you yet</h4>
          <p className="text-sm text-gray-500 mb-4">
            Add some context about your goals, skills, and situation so I can give you personalized
            advice.
          </p>
          <Link
            href="/dashboard/documents/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Context
          </Link>
        </div>
      )}

      {/* Permissions link */}
      <div className="px-5 py-4 border-t border-gray-100">
        <Link
          href="/dashboard/cat/permissions"
          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Settings className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Manage Permissions</span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
        </Link>
      </div>
    </div>
  );
}

export default CatContextPanel;
