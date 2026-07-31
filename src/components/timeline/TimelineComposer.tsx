'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Globe, ImagePlus, Lock, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { usePostComposer } from '@/hooks/usePostComposerNew';
import { useContentEditableEditor } from '@/hooks/useContentEditableEditor';
import AvatarLink from '@/components/ui/AvatarLink';
import { cn } from '@/lib/utils';
import {
  TIMELINE_CONTENT_LIMITS,
  TIMELINE_COPY,
  TIMELINE_SURFACE,
  TIMELINE_VISIBILITY_OPTIONS,
} from '@/config/timeline';
import {
  TextFormatToolbar,
  ProjectSelectionPanel,
  ProjectToggleButton,
  ComposerMessages,
  CharacterCounter,
  OfflineIndicator,
  ContextIndicator,
} from './ComposerShared';
import PostAiButton from './PostAiButton';
import ReplyAiButton from './ReplyAiButton';
import PostAiEditMenu from './PostAiEditMenu';
import ImageSuggestPicker from '@/components/articles/ImageSuggestPicker';
import type { StockImage } from '@/services/images/types';

export interface TimelineComposerProps {
  targetOwnerId?: string;
  targetOwnerType?: 'profile' | 'project';
  targetOwnerName?: string;
  allowProjectSelection?: boolean;
  onPostCreated?: () => void;
  onOptimisticUpdate?: (event: import('@/types/timeline').TimelineDisplayEvent) => void;
  onCancel?: () => void;
  placeholder?: string;
  buttonText?: string;
  showBanner?: boolean;
  parentEventId?: string;
  /** In reply mode: the post being answered, so AI can draft a grounded reply. */
  parentPostText?: string;
  parentAuthorName?: string;
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
  buttonText = TIMELINE_COPY.postButton,
  showBanner = true,
  parentEventId,
  parentPostText,
  parentAuthorName,
  simpleMode = true,
}: TimelineComposerProps) {
  const { user, profile } = useAuth();
  const [showProjects, setShowProjects] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

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

  const postingToOwnTimeline = useMemo(
    () => !targetOwnerId || targetOwnerId === user?.id,
    [targetOwnerId, user?.id]
  );

  const targetName = useMemo(
    () => targetOwnerName || (postingToOwnTimeline ? 'your timeline' : 'this timeline'),
    [targetOwnerName, postingToOwnTimeline]
  );

  const defaultPlaceholder = postingToOwnTimeline
    ? TIMELINE_COPY.composePlaceholder
    : `Write on ${targetName}...`;

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

  const handlePickImage = useCallback(
    (img: StockImage) => {
      postComposer.setImage({
        url: img.fullUrl,
        alt: img.title,
        credit: img.creator,
        license: img.license,
        source_url: img.sourceUrl,
      });
      setShowImagePicker(false);
    },
    [postComposer]
  );

  const isButtonDisabled = useMemo(
    () =>
      !postComposer.content.trim() ||
      postComposer.isPosting ||
      postComposer.content.length > TIMELINE_CONTENT_LIMITS.post,
    [postComposer.content, postComposer.isPosting]
  );

  return (
    <div className={cn('mx-auto max-w-2xl transition-colors', TIMELINE_SURFACE.composer)}>
      <div className="flex gap-3">
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

        <div className="flex-1 min-w-0">
          {!postingToOwnTimeline && showBanner && <ContextIndicator targetName={targetName} />}

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
              simpleMode ? 'min-h-[3.25rem] text-base' : 'min-h-[6rem] text-base',
              'border-none bg-transparent p-0 focus:outline-none',
              'leading-relaxed break-words',
              'max-h-[60vh] overflow-y-auto',
              'empty:before:content-[attr(data-placeholder)]',
              'empty:before:text-fg-tertiary dark:empty:before:text-fg-secondary',
              'empty:before:pointer-events-none',
              postComposer.isPosting && 'opacity-50 cursor-not-allowed'
            )}
            suppressContentEditableWarning
          />

          {showProjects && allowProjectSelection && (
            <ProjectSelectionPanel
              projects={postComposer.userProjects}
              selectedProjects={postComposer.selectedProjects}
              onToggle={handleToggleProject}
              onClose={handleCloseProjects}
              isPosting={postComposer.isPosting}
            />
          )}

          {postComposer.image && (
            <div className="relative mt-3 inline-block max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element -- external (Openverse) host, not in next/image remotePatterns */}
              <img
                src={postComposer.image.url}
                alt={postComposer.image.alt}
                className="max-h-56 max-w-full rounded-lg border border-subtle object-cover"
              />
              <button
                type="button"
                onClick={() => postComposer.setImage(null)}
                disabled={postComposer.isPosting}
                aria-label="Remove image"
                className="absolute right-2 top-2 rounded-full border border-subtle bg-surface-base/90 p-1 text-fg-primary transition-colors hover:bg-surface-base"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {showImagePicker && !postComposer.image && (
            <div className="mt-3">
              <ImageSuggestPicker
                title=""
                body={postComposer.content}
                heading="Add an image"
                onPick={handlePickImage}
                onClose={() => setShowImagePicker(false)}
              />
            </div>
          )}

          <ComposerMessages error={postComposer.error} success={postComposer.postSuccess} />

          <div className="mt-4 flex items-center justify-between border-t border-subtle pt-3">
            <div className="flex flex-wrap items-center gap-2">
              {!parentEventId && (
                <PostAiButton onDraft={postComposer.setContent} disabled={postComposer.isPosting} />
              )}
              {parentEventId && parentPostText && (
                <ReplyAiButton
                  parentText={parentPostText}
                  parentAuthor={parentAuthorName}
                  onDraft={postComposer.setContent}
                  disabled={postComposer.isPosting}
                />
              )}
              {postComposer.content.trim() && (
                <PostAiEditMenu
                  text={postComposer.content}
                  onRevised={postComposer.setContent}
                  disabled={postComposer.isPosting}
                />
              )}
              <button
                type="button"
                onClick={() => setShowImagePicker(v => !v)}
                disabled={postComposer.isPosting}
                className={cn(
                  TIMELINE_SURFACE.chip,
                  (showImagePicker || postComposer.image) && TIMELINE_SURFACE.chipActive,
                  'gap-1.5'
                )}
                title="Add a free image (AI-suggested from your post)"
                aria-expanded={showImagePicker}
              >
                <ImagePlus className="h-4 w-4" />
                Image
              </button>
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
                  {TIMELINE_VISIBILITY_OPTIONS.map(preset => {
                    const Icon = preset.Icon;
                    const isActive = postComposer.visibility === preset.key;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => postComposer.setVisibility(preset.key)}
                        disabled={postComposer.isPosting}
                        className={cn(
                          TIMELINE_SURFACE.chip,
                          isActive && TIMELINE_SURFACE.chipActive
                        )}
                        title={preset.description}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Icon className="w-4 h-4" />
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
                  className={TIMELINE_SURFACE.iconButton}
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
              {!simpleMode && (
                <CharacterCounter
                  count={postComposer.content.length}
                  max={TIMELINE_CONTENT_LIMITS.post}
                />
              )}

              <Button
                onClick={postComposer.handlePost}
                disabled={isButtonDisabled}
                className={TIMELINE_SURFACE.buttonPrimary}
                size="sm"
              >
                {postComposer.isPosting ? TIMELINE_COPY.postingButton : buttonText}
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
