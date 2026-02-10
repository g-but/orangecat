/**
 * SMART QUESTIONS PANEL
 *
 * Contextual questions for engaged users to encourage platform usage.
 * Questions are dynamically generated based on user state.
 *
 * KEY PRINCIPLES:
 * - One-click actions where possible
 * - Context-aware (knows user's entities)
 * - Progressive engagement
 * - Low friction UX
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-07
 */

'use client';

import { useState } from 'react';
import { ArrowRight, Lightbulb, X } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import type { SmartQuestion } from '@/services/recommendations/types';

interface SmartQuestionsPanelProps {
  questions: SmartQuestion[];
  className?: string;
  /** Maximum questions to show */
  maxQuestions?: number;
  /** Title for the section */
  title?: string;
}

export function SmartQuestionsPanel({
  questions,
  className = '',
  maxQuestions = 3,
  title = 'What would you like to do next?',
}: SmartQuestionsPanelProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Filter out dismissed questions
  const visibleQuestions = questions.filter(q => !dismissedIds.has(q.id)).slice(0, maxQuestions);

  const dismissQuestion = (id: string) => {
    setDismissedIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  };

  if (visibleQuestions.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>

      <div className="space-y-2">
        {visibleQuestions.map(question => (
          <QuestionCard
            key={question.id}
            question={question}
            onDismiss={() => dismissQuestion(question.id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual question card
 */
function QuestionCard({ question, onDismiss }: { question: SmartQuestion; onDismiss: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-100 transition-colors group">
      <p className="text-sm text-gray-700 flex-1">{question.question}</p>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link href={question.action.href}>
          <Button
            size="sm"
            variant="outline"
            className="bg-white hover:bg-amber-100 border-amber-200 text-amber-700 hover:border-amber-300"
          >
            {question.action.label}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>

        <button
          onClick={onDismiss}
          className="p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Dismiss question"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Compact inline version for tighter spaces
 */
export function SmartQuestionInline({
  question,
  onDismiss,
}: {
  question: SmartQuestion;
  onDismiss?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
      <span className="text-gray-600">{question.question}</span>
      <Link href={question.action.href}>
        <Button
          size="sm"
          variant="ghost"
          className="text-tiffany-600 hover:text-tiffany-700 p-1 h-auto"
        >
          {question.action.label}
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </Button>
      </Link>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 text-gray-400 hover:text-gray-600 rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default SmartQuestionsPanel;
