'use client';

import {
  FileText,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Edit3,
  X,
} from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useProjectStore } from '@/stores/projectStore';
import { formatDistanceToNow } from 'date-fns';

interface DraftContinueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueDraft: () => void;
  onStartFresh: () => void;
}

export default function DraftContinueDialog({
  isOpen,
  onClose,
  onContinueDraft,
  onStartFresh,
}: DraftContinueDialogProps) {
  const { drafts } = useProjectStore();

  const hasAnyDraft = drafts.length > 0;
  const primaryDraft = hasAnyDraft ? drafts[0] : null;

  if (!isOpen || !hasAnyDraft || !primaryDraft) {
    return null;
  }

  const isLocalDraft = primaryDraft.isDraft;
  const totalDrafts = drafts.length;

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

  const getCompletionPercentage = () => {
    // Simple completion percentage based on filled fields
    let completed = 0;
    const total = 6;

    if (primaryDraft.title) {
      completed++;
    }
    if (primaryDraft.description) {
      completed++;
    }
    if (primaryDraft.goal_amount) {
      completed++;
    }
    if (primaryDraft.category) {
      completed++;
    }
    if (primaryDraft.bitcoin_address) {
      completed++;
    }
    if (primaryDraft.website_url) {
      completed++;
    }

    return Math.round((completed / total) * 100);
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-modal flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl border-0">
        <CardContent className="p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    You Have Unfinished Work
                  </h2>
                  <p className="text-gray-600">
                    What would you like to do with your{' '}
                    {totalDrafts > 1 ? 'draft projects' : 'draft project'}?
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-white/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Draft Summary */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              {isLocalDraft && (
                <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium animate-pulse">
                  UNSAVED
                </div>
              )}
              <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                {completionPercentage}% Complete
              </div>
              {totalDrafts > 1 && (
                <div className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                  +{totalDrafts - 1} More {totalDrafts > 2 ? 'Drafts' : 'Draft'}
                </div>
              )}
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">&ldquo;{primaryDraft.title}&rdquo;</h3>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Last saved {formatLastUpdated(new Date(primaryDraft.updated_at))}</span>
              </div>
              {isLocalDraft && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Draft in progress</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Project Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Options */}
          <div className="p-6 space-y-4">
            {/* Continue Draft - Primary Action */}
            <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50 hover:bg-blue-100 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Continue Where You Left Off</h4>
                    <p className="text-sm text-gray-600">
                      {isLocalDraft
                        ? 'Resume your unsaved progress and complete your project'
                        : 'Complete your draft project and publish it'}
                    </p>
                  </div>
                </div>
                <div className="text-blue-600 text-sm font-medium">Recommended</div>
              </div>

              <Button
                onClick={onContinueDraft}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Continue Editing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Start Fresh - Secondary Action */}
            <div className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Start a New Project</h4>
                    <p className="text-sm text-gray-600">
                      Create a completely new project from scratch
                    </p>
                  </div>
                </div>
              </div>

              {isLocalDraft && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-yellow-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Your unsaved progress will be kept for later</span>
                  </div>
                </div>
              )}

              <Button
                onClick={onStartFresh}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Start Fresh
              </Button>
            </div>

            {/* Additional Options */}
            {totalDrafts > 1 && (
              <div className="pt-4 border-t border-gray-200">
                <Link href="/dashboard/projects">
                  <Button variant="ghost" className="w-full text-gray-600 hover:text-gray-800">
                    View All {totalDrafts} Draft Projects
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
