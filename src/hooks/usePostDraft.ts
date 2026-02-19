import { useCallback, useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import { TimelineVisibility } from '@/types/timeline';

interface UsePostDraftOptions {
  subjectType: string;
  subjectId?: string;
  enableDrafts: boolean;
  debounceMs: number;
  defaultVisibility: TimelineVisibility;
}

interface DraftState {
  content: string;
  visibility: TimelineVisibility;
  selectedProjects: string[];
}

interface DraftSetters {
  setContent: (content: string) => void;
  setVisibility: (visibility: TimelineVisibility) => void;
  setSelectedProjects: (projects: string[]) => void;
}

interface UsePostDraftReturn {
  saveDraft: (draftContent: string) => void;
  loadDraft: () => void;
  clearDraft: () => void;
}

/**
 * Manages draft persistence via localStorage.
 * Handles auto-save (debounced) and load-on-mount.
 */
export function usePostDraft(
  options: UsePostDraftOptions,
  state: DraftState,
  setters: DraftSetters
): UsePostDraftReturn {
  const { subjectType, subjectId, enableDrafts, debounceMs, defaultVisibility } = options;
  const { content, visibility, selectedProjects } = state;

  const debounceTimer = useRef<NodeJS.Timeout>();
  const draftKey = `post-draft-${subjectType}-${subjectId || 'general'}`;

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const saveDraft = useCallback(
    (draftContent: string) => {
      if (!enableDrafts || !draftContent.trim()) {
        return;
      }

      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            content: draftContent,
            visibility,
            selectedProjects,
            timestamp: Date.now(),
            subjectType,
            subjectId,
          })
        );
      } catch (err) {
        logger.warn('Failed to save draft', err, 'usePostDraft');
      }
    },
    [enableDrafts, draftKey, visibility, selectedProjects, subjectType, subjectId]
  );

  const loadDraft = useCallback(() => {
    if (!enableDrafts) {
      return;
    }

    try {
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        const parsed = JSON.parse(draft);
        // Only load if draft is recent (last 24 hours)
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setters.setContent(parsed.content || '');
          setters.setVisibility(parsed.visibility || defaultVisibility);
          setters.setSelectedProjects(parsed.selectedProjects || []);
        } else {
          // Clear old draft
          localStorage.removeItem(draftKey);
        }
      }
    } catch (err) {
      logger.warn('Failed to load draft', err, 'usePostDraft');
    }
  }, [enableDrafts, draftKey, defaultVisibility, setters]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
    } catch (err) {
      logger.warn('Failed to clear draft', err, 'usePostDraft');
    }
  }, [draftKey]);

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  // Auto-save drafts (debounced)
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      saveDraft(content);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [content, visibility, selectedProjects, saveDraft, debounceMs]);

  return { saveDraft, loadDraft, clearDraft };
}
