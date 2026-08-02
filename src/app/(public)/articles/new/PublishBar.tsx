'use client';

import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { TIMELINE_SURFACE, TIMELINE_VISIBILITY_OPTIONS } from '@/config/timeline';
import { ARTICLE_COPY } from '@/config/articles';
import type { TimelineVisibility } from '@/types/timeline';

/**
 * Visibility selector + publish/save button row.
 * Extracted from ArticleComposer.tsx (pure move — markup unchanged).
 */
export default function PublishBar({
  visibility,
  setVisibility,
  publishing,
  canPublish,
  isEditing,
  onPublish,
}: {
  visibility: TimelineVisibility;
  setVisibility: (v: TimelineVisibility) => void;
  publishing: boolean;
  canPublish: boolean;
  isEditing: boolean;
  onPublish: () => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-subtle pt-4">
      <div className="flex items-center gap-2">
        {TIMELINE_VISIBILITY_OPTIONS.map(option => {
          const Icon = option.Icon;
          const active = visibility === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setVisibility(option.key)}
              disabled={publishing}
              className={cn(TIMELINE_SURFACE.chip, active && TIMELINE_SURFACE.chipActive)}
              title={option.description}
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>
      <Button variant="accent" onClick={onPublish} disabled={!canPublish} isLoading={publishing}>
        {isEditing
          ? publishing
            ? ARTICLE_COPY.edit.saving
            : ARTICLE_COPY.edit.save
          : publishing
            ? ARTICLE_COPY.new.publishing
            : ARTICLE_COPY.new.publish}
      </Button>
    </div>
  );
}
