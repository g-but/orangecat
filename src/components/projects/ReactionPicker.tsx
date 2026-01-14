/**
 * Reaction Picker Component
 *
 * Quick reaction picker for project support.
 * Allows users to quickly react with emojis.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created reaction picker component
 */

'use client';

import { useState } from 'react';
import { REACTION_EMOJIS, REACTION_LABELS } from '@/services/projects/support/constants';
import type { ReactionEmoji } from '@/services/projects/support/types';

interface ReactionPickerProps {
  onReactionSelect: (emoji: ReactionEmoji) => void;
  disabled?: boolean;
  className?: string;
}

export function ReactionPicker({
  onReactionSelect,
  disabled = false,
  className,
}: ReactionPickerProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<ReactionEmoji | null>(null);

  const handleReaction = (emoji: ReactionEmoji) => {
    setSelectedEmoji(emoji);
    onReactionSelect(emoji);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {REACTION_EMOJIS.map(emoji => (
        <button
          key={emoji}
          onClick={() => handleReaction(emoji)}
          disabled={disabled}
          className={`
            text-2xl p-2 rounded-lg transition-all duration-200
            hover:scale-110 hover:bg-gray-100
            active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            ${selectedEmoji === emoji ? 'bg-orange-100 scale-110' : ''}
          `}
          title={REACTION_LABELS[emoji]}
          aria-label={`React with ${REACTION_LABELS[emoji]}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
