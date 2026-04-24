/**
 * MESSAGE BUBBLE COMPONENT
 * Displays a single chat message with avatar and actions
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Cat, User, Copy, Check, Clock, X } from 'lucide-react';
import { AI_MODEL_REGISTRY } from '@/config/ai-models';
import { renderChatMarkdown } from '@/utils/markdown';
import { ActionButton } from './ActionButton';
import type { Message, CatAction, ExecActionResult } from '../types';

// Human-readable labels for exec_action IDs — shown when no displayMessage is available
const ACTION_LABELS: Record<string, string> = {
  // Productivity
  set_reminder: 'Reminder',
  create_task: 'Task',
  complete_task: 'Task',
  update_task: 'Task',
  // Communication
  post_to_timeline: 'Timeline post',
  send_message: 'Message',
  reply_to_message: 'Reply',
  // Payments & wallets
  send_payment: 'Payment',
  fund_project: 'Contribution',
  add_wallet: 'Wallet',
  // Context
  add_context: 'Context saved',
  update_profile: 'Profile',
  // Entities
  create_product: 'Product',
  create_service: 'Service',
  create_project: 'Project',
  create_cause: 'Cause',
  create_event: 'Event',
  create_asset: 'Asset',
  create_loan: 'Loan',
  create_investment: 'Investment',
  create_research: 'Research',
  create_wishlist: 'Wishlist',
  create_ai_assistant: 'AI assistant',
  create_organization: 'Organization',
  // Entity management
  update_entity: 'Entity',
  publish_entity: 'Entity',
  archive_entity: 'Entity',
  invite_to_organization: 'Invitation',
};

function ExecResultChip({ result }: { result: ExecActionResult }) {
  const noun = ACTION_LABELS[result.actionId] ?? result.actionId;

  if (result.status === 'completed') {
    // Prefer the handler's displayMessage; fall back to generic "noun done"
    const label = result.displayMessage ?? `${noun} done`;
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 border border-green-100">
        <Check className="h-3 w-3 flex-shrink-0" />
        {label}
      </span>
    );
  }

  if (result.status === 'pending_confirmation') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
        <Clock className="h-3 w-3 flex-shrink-0" />
        {noun} — confirm below
      </span>
    );
  }

  // failed
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-100"
      title={result.error}
    >
      <X className="h-3 w-3 flex-shrink-0" />
      {noun} failed{result.error ? `: ${result.error}` : ''}
    </span>
  );
}

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  onActionClick?: (action: CatAction) => void;
}

export function MessageBubble({ message, isLast, onActionClick }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  // Clean the message content by removing action and exec_action blocks for display
  const displayContent = message.content.replace(/```(?:action|exec_action)[\s\S]*?```/g, '').trim();

  const handleCopy = () => {
    void navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn('flex gap-3 max-w-3xl mx-auto px-4', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-gray-200' : 'bg-gradient-to-br from-orange-400 to-orange-500'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-gray-600" />
        ) : (
          <Cat className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-w-0', isUser ? 'text-right' : 'text-left')}>
        <div
          className={cn(
            'inline-block rounded-2xl px-4 py-2.5 max-w-full',
            isUser
              ? 'bg-orange-500 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-900 rounded-tl-sm'
          )}
        >
          <div
            className={cn('break-words text-sm leading-relaxed', isUser && 'whitespace-pre-wrap')}
          >
            {isUser ? displayContent : renderChatMarkdown(displayContent)}
            {isLast && !isUser && !displayContent && (
              <span className="inline-flex items-center gap-1">
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {!isUser && message.actions && message.actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.actions.map((action, idx) => (
              <ActionButton key={idx} action={action} onClick={() => onActionClick?.(action)} />
            ))}
          </div>
        )}

        {/* Exec action result chips */}
        {!isUser && message.execResults && message.execResults.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.execResults.map((result, idx) => (
              <ExecResultChip key={idx} result={result} />
            ))}
          </div>
        )}

        {/* Model used indicator + copy button */}
        {!isUser && message.modelUsed && displayContent && (
          <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
            <span>{AI_MODEL_REGISTRY[message.modelUsed]?.name || message.modelUsed}</span>
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
              title="Copy response"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
