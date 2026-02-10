'use client';

import { useState } from 'react';
import { Clock, Edit3, ArrowRight, X, FileText } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useProjectStore, Campaign } from '@/stores/projectStore';
import { formatDistanceToNow } from 'date-fns';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

interface DraftPromptProps {
  className?: string;
}

export default function DraftPrompt({ className }: DraftPromptProps) {
  const { drafts, isLoading } = useProjectStore();
  const { formatAmount } = useDisplayCurrency();
  const [dismissed, setDismissed] = useState(false);

  const hasAnyDraft = drafts.length > 0;
  const primaryDraft = hasAnyDraft ? drafts[0] : null;

  // Don't show if no drafts or dismissed
  if (isLoading || dismissed || !hasAnyDraft || !primaryDraft) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) {
      return 'recently';
    }
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const _getCompletionPercentage = (draft: Campaign) => {
    let completed = 0;
    const total = 6; // title, description, goal, category, bitcoin_address, website

    if (draft.title) {
      completed++;
    }
    if (draft.description) {
      completed++;
    }
    if (draft.goal_amount) {
      completed++;
    }
    if (draft.category) {
      completed++;
    }
    // Add more fields as needed

    return Math.round((completed / total) * 100);
  };

  const isDraftLocal = primaryDraft.isDraft;
  const totalDrafts = drafts.length;

  return (
    <Card className={`border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Edit3 className="w-6 h-6 text-blue-600" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isDraftLocal ? 'Continue Your Project' : 'Complete Your Project'}
                </h3>
                <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  {isDraftLocal ? 'Unsaved' : 'Draft'}
                </div>
                {isDraftLocal && (
                  <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium animate-pulse">
                    URGENT
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-gray-700">
                  {isDraftLocal ? (
                    <>
                      You have unsaved progress:{' '}
                      <span className="font-medium">&ldquo;{primaryDraft.title}&rdquo;</span>
                    </>
                  ) : (
                    <>
                      You have an incomplete project:{' '}
                      <span className="font-medium">&ldquo;{primaryDraft.title}&rdquo;</span>
                    </>
                  )}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      Last {isDraftLocal ? 'saved' : 'updated'}:{' '}
                      {formatLastUpdated(new Date(primaryDraft.updated_at))}
                    </span>
                  </div>
                  {isDraftLocal && (
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>Draft in progress</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <Link href="/projects/create">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Edit3 className="w-4 h-4 mr-2" />
                    {isDraftLocal ? 'Continue Editing' : 'Complete Project'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>

                {totalDrafts > 1 && (
                  <Link href="/dashboard/projects">
                    <Button variant="outline">View All Drafts ({totalDrafts})</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-white/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// Additional component for showing multiple drafts in a compact format
export function DraftsList({ className }: { className?: string }) {
  const { drafts, isLoading } = useProjectStore();
  const { formatAmount } = useDisplayCurrency();

  if (isLoading || drafts.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Draft Projects ({drafts.length})
      </h3>

      <div className="space-y-2">
        {drafts.slice(0, 3).map((draft: Campaign) => (
          <Card key={draft.id} className="border-gray-200 hover:border-blue-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 truncate">{draft.title}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span>
                      Updated {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                    </span>
                    {draft.goal_amount && <span>Goal: {formatAmount(draft.goal_amount)}</span>}
                  </div>
                </div>

                <Link href="/projects/create">
                  <Button size="sm" variant="outline">
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {drafts.length > 3 && (
          <Link href="/dashboard/projects">
            <Button variant="ghost" className="w-full">
              View {drafts.length - 3} more drafts
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
