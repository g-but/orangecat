'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Globe, Lock, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import { usePostComposer } from '@/hooks/usePostComposerNew';
import { useContentEditableEditor } from '@/hooks/useContentEditableEditor';
import AvatarLink from '@/components/ui/AvatarLink';
import { cn } from '@/lib/utils';
import {
  TextFormatToolbar,
  ProjectSelectionPanel,
  ProjectToggleButton,
  ComposerMessages,
  CharacterCounter,
  OfflineIndicator,
  ContextIndicator,
} from './ComposerShared';

/**
 * TimelineComposer Component - X-Inspired Minimal Design
 *
 * PRIMARY COMPOSER for inline timeline posting.
 * Clean, minimal composer inspired by X (Twitter) design principles.
 *
 * Features:
 * - Minimal visual weight (no heavy cards/gradients)
 * - Progressive disclosure (collapsible project selection)
 * - Basic text formatting (bold/italic via markdown)
 * - Modular, maintainable, DRY code
 *
 * Uses shared components from ComposerShared.tsx for DRY compliance.
 *
 * @see PostComposerMobile for full-screen mobile modal variant
 * @see ComposerShared for reusable UI components
 */

export interface TimelineComposerProps {
  targetOwnerId?: string;
  targetOwnerType?: 'profile' | 'project';
  targetOwnerName?: string;
  allowProjectSelection?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPostCreated?: (event?: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOptimisticUpdate?: (event: any) => void;
  onCancel?: () => void;
  placeholder?: string;
  buttonText?: string;
  showBanner?: boolean;
  /** Parent event ID for replies */
  parentEventId?: string;
  /** Simplified UI that hides advanced controls */
  simpleMode?: boolean;
}

const TimelineComposer = React.memo(function TimelineComposer({
  targetOwnerId,
  targetOwnerType = 'profile',
  targetOwnerName,
  allowProjectSelection = false,
  onPostCreated,
  onOptimisticUpdate,
  onCancel,
  placeholder,
  buttonText = 'Post',
  showBanner = true,
  parentEventId,
  simpleMode = true,
}: TimelineComposerProps) {
  const { user, profile } = useAuth();
  const [showProjects, setShowProjects] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const VISIBILITY_PRESETS = useMemo(
    () => [
      { key: 'public' as const, label: 'Public', icon: Globe, description: 'Visible to everyone' },
      {
        key: 'followers' as const,
        label: 'Followers',
        icon: Users,
        description: 'People who follow you',
      },
      { key: 'private' as const, label: 'Only me', icon: Lock, description: 'Just you' },
    ],
    []
  );

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Use the post composer hook
  const postComposer = usePostComposer({
    subjectType: targetOwnerType,
    subjectId: targetOwnerId,
    allowProjectSelection,
    onSuccess: () => {
      onPostCreated?.();
      setShowProjects(false);
    },
    onOptimisticUpdate,
    parentEventId,
  });

  // Determine if posting to own timeline
  const postingToOwnTimeline = useMemo(
    () => !targetOwnerId || targetOwnerId === user?.id,
    [targetOwnerId, user?.id]
  );

  const targetName = useMemo(
    () => targetOwnerName || (postingToOwnTimeline ? 'your timeline' : 'this timeline'),
    [targetOwnerName, postingToOwnTimeline]
  );

  // Default placeholder
  const defaultPlaceholder = postingToOwnTimeline
    ? "What's happening?"
    : `Write on ${targetName}...`;

  // Use the shared contentEditable editor hook
  const { editorRef, handleInput, handlePaste, handleKeyDown, handleFormat } =
    useContentEditableEditor({
      content: postComposer.content,
      onContentChange: postComposer.setContent,
      onSubmit: () => {
        if (!postComposer.isPosting && postComposer.content.trim()) {
          postComposer.handlePost();
        }
      },
      onCancel,
      maxHeight: 480,
      disabled: postComposer.isPosting,
    });

  // Project selection handlers
  const handleToggleProject = useCallback(
    (id: string) => {
      postComposer.toggleProjectSelection(id);
    },
    [postComposer]
  );

  const handleCloseProjects = useCallback(() => {
    setShowProjects(false);
  }, []);

  const handleOpenProjects = useCallback(() => {
    setShowProjects(true);
  }, []);

  // Button disabled state
  const isButtonDisabled = useMemo(
    () =>
      !postComposer.content.trim() || postComposer.isPosting || postComposer.content.length > 500,
    [postComposer.content, postComposer.isPosting]
  );

  return (
    <div className="max-w-2xl mx-auto border-b border-gray-200 bg-white px-4 sm:px-5 py-4 transition-all">
      <div className="flex gap-3">
        {/* User Avatar - Using AvatarLink component */}
        <div className="pt-0.5 sm:pt-1 flex-shrink-0">
          <AvatarLink
            username={profile?.username || null}
            userId={user?.id || null}
            avatarUrl={profile?.avatar_url || user?.user_metadata?.avatar_url || null}
            name={profile?.name || user?.user_metadata?.name || user?.email || 'User'}
            size={44}
            className="flex-shrink-0"
            isCurrentUser={true}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Subtle Context Indicator (Replacement for Banner) */}
          {!postingToOwnTimeline && showBanner && <ContextIndicator targetName={targetName} />}

          {/* ContentEditable Input - Shows formatted text inline (like X) */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            data-placeholder={placeholder || defaultPlaceholder}
            role="textbox"
            aria-multiline="true"
            aria-label="Compose new post"
            className={cn(
              'w-full leading-6',
              simpleMode ? 'min-h-[3.25rem] text-[16px]' : 'min-h-[6rem] text-[17px]',
              'border-none bg-transparent p-0 focus:outline-none',
              'leading-relaxed break-words',
              'max-h-[60vh] overflow-y-auto',
              'empty:before:content-[attr(data-placeholder)]',
              'empty:before:text-gray-400',
              'empty:before:pointer-events-none',
              postComposer.isPosting && 'opacity-50 cursor-not-allowed'
            )}
            style={{ fontSize: simpleMode ? '16px' : '17px' }} // Prevent iOS zoom on focus
            suppressContentEditableWarning
          />

          {/* Project Selection Panel (Collapsible) */}
          {showProjects && allowProjectSelection && (
            <ProjectSelectionPanel
              projects={postComposer.userProjects}
              selectedProjects={postComposer.selectedProjects}
              onToggle={handleToggleProject}
              onClose={handleCloseProjects}
              isPosting={postComposer.isPosting}
            />
          )}

          {/* Error/Success Messages */}
          <ComposerMessages error={postComposer.error} success={postComposer.postSuccess} />

          {/* Bottom Toolbar - simplified by default */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sky-600 flex-wrap">
              {!simpleMode && <TextFormatToolbar onFormat={handleFormat} />}

              {!simpleMode && allowProjectSelection && postComposer.userProjects.length > 0 && (
                <ProjectToggleButton
                  showProjects={showProjects}
                  selectedCount={postComposer.selectedProjects.length}
                  onToggle={showProjects ? handleCloseProjects : handleOpenProjects}
                />
              )}

              {simpleMode ? (
                <div className="flex items-center gap-2">
                  {VISIBILITY_PRESETS.map(preset => {
                    const Icon = preset.icon;
                    const isActive = postComposer.visibility === preset.key;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => postComposer.setVisibility(preset.key)}
                        disabled={postComposer.isPosting}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-semibold border transition-colors',
                          isActive
                            ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-sky-300'
                        )}
                        title={preset.description}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Icon className="w-3.5 h-3.5" />
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    postComposer.setVisibility(
                      postComposer.visibility === 'public' ? 'private' : 'public'
                    )
                  }
                  disabled={postComposer.isPosting}
                  className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-sky-50 active:bg-sky-100 transition-colors text-sky-600 disabled:opacity-50 touch-manipulation"
                  title={
                    postComposer.visibility === 'public'
                      ? 'Public - Everyone can see'
                      : 'Private - Only you can see'
                  }
                  aria-label={`Post visibility: ${postComposer.visibility}`}
                >
                  {postComposer.visibility === 'public' ? (
                    <Globe className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <OfflineIndicator isOnline={isOnline} />
              {!simpleMode && <CharacterCounter count={postComposer.content.length} />}

              <Button
                onClick={postComposer.handlePost}
                disabled={isButtonDisabled}
                className="rounded-full px-5 py-2 text-sm font-bold bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white shadow-sm disabled:opacity-50 disabled:shadow-none transition-all"
                size="sm"
              >
                {postComposer.isPosting ? 'Posting...' : buttonText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

TimelineComposer.displayName = 'TimelineComposer';

export default TimelineComposer;
