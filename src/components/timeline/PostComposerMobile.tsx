'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import BottomSheet from '@/components/ui/BottomSheet';
import AvatarLink from '@/components/ui/AvatarLink';
import { Globe, ChevronDown, ArrowLeft, ImageIcon } from 'lucide-react';
import { usePostComposer, type PostComposerOptions } from '@/hooks/usePostComposerNew';
import { useContentEditableEditor } from '@/hooks/useContentEditableEditor';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/validation';
import { TextFormatToolbar, ComposerMessages, CharacterCounter } from './ComposerShared';

/**
 * MOBILE-FIRST Post Composer Component
 *
 * SECONDARY COMPOSER for full-screen mobile modal posting.
 * Designed for touch-first interaction with progressive enhancement for larger screens.
 *
 * Features:
 * - Bottom sheet UI for full-screen modal
 * - Touch-optimized controls (min 44px targets)
 * - Offline support, auto-save drafts
 * - X-style full-screen mode via fullScreen prop
 *
 * Uses shared components from ComposerShared.tsx for DRY compliance.
 *
 * @see TimelineComposer for inline posting variant
 * @see ComposerShared for reusable UI components
 */

export interface PostComposerMobileProps extends PostComposerOptions {
  placeholder?: string;
  buttonText?: string;
  showVisibilityToggle?: boolean;
  showProjectSelection?: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
  compact?: boolean; // Compact mode for timeline integration
  fullScreen?: boolean; // X-style full-screen mode using BottomSheet
  isOpen?: boolean; // For full-screen modal behavior
  onClose?: () => void; // For full-screen modal close
}

const PostComposerMobile: React.FC<PostComposerMobileProps> = ({
  placeholder = "What's on your mind?",
  buttonText = 'Post',
  showVisibilityToggle = true,
  showProjectSelection = false,
  autoFocus = false,
  onCancel,
  compact = false,
  fullScreen = false,
  isOpen,
  onClose,
  ...composerOptions
}) => {
  const { user, profile } = useAuth();
  const composer = usePostComposer({
    ...composerOptions,
    allowProjectSelection: showProjectSelection,
    onSuccess: () => {
      composerOptions.onSuccess?.();
      if (fullScreen && onClose) {
        onClose();
      }
    },
  });

  const [isOptionsSheetOpen, setIsOptionsSheetOpen] = useState(false);

  // Lazy load project selection modal (always available, only rendered when needed)
  const LazyProjectSelectionModal = dynamic(() => import('./ProjectSelectionModal'), {
    ssr: false,
    loading: () => null,
  });

  // Use the shared contentEditable editor hook
  const { editorRef, handleInput, handlePaste, handleKeyDown, handleFormat } =
    useContentEditableEditor({
      content: composer.content,
      onContentChange: composer.setContent,
      onSubmit: composer.handlePost,
      onCancel: onCancel || (fullScreen ? onClose : undefined),
      maxHeight: fullScreen ? 480 : 320,
      disabled: composer.isPosting,
      sanitizer: sanitizeHtml,
    });

  // Auto-focus on mount (mobile-friendly)
  useEffect(() => {
    if ((autoFocus || fullScreen || isOpen) && editorRef.current && !compact) {
      // Delay focus for mobile keyboards
      setTimeout(() => editorRef.current?.focus(), 100);
    }
  }, [autoFocus, compact, fullScreen, isOpen, editorRef]);

  // Render composer content (reusable for both Card and BottomSheet)
  const renderComposerContent = () => (
    <>
      {/* X-style full-screen header */}
      {fullScreen && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button
            onClick={onClose || onCancel}
            className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close composer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <Button
            onClick={composer.handlePost}
            disabled={!composer.canPost}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5 min-h-[36px] disabled:opacity-50"
          >
            {composer.isPosting ? 'Posting...' : buttonText}
          </Button>
        </div>
      )}

      {/* Main content area */}
      <div className={cn('flex gap-3', fullScreen ? 'px-4 pt-4' : '')}>
        {/* Avatar */}
        <div className={cn('flex-shrink-0', fullScreen ? 'pt-1' : '')}>
          {fullScreen ? (
            <AvatarLink
              username={profile?.username || null}
              userId={user?.id || null}
              avatarUrl={profile?.avatar_url || user?.user_metadata?.avatar_url || null}
              name={profile?.name || user?.user_metadata?.name || 'User'}
              size={44}
            />
          ) : (
            !compact && (
              <div className="flex-shrink-0">
                {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Dynamic user avatar with onError fallback
                  <img
                    src={profile?.avatar_url || user?.user_metadata?.avatar_url || ''}
                    alt={user?.user_metadata?.name || 'User avatar'}
                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <span className="text-white font-semibold text-sm">
                      {(user?.user_metadata?.name || user?.email || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* Crosspost selector (X-style) */}
          {fullScreen && showProjectSelection && (
            <button
              onClick={() => setIsOptionsSheetOpen(true)}
              className="mb-3 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 flex items-center gap-1 transition-colors min-h-[32px]"
            >
              {composer.selectedProjects.length > 0
                ? `${composer.selectedProjects.length} project${composer.selectedProjects.length > 1 ? 's' : ''}`
                : 'Crosspost to projects'}
              <ChevronDown className="w-4 h-4" />
            </button>
          )}

          {/* Header with user info (only in non-compact, non-fullscreen mode) */}
          {!compact && !fullScreen && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {user?.user_metadata?.name ||
                    (typeof user?.email === 'string' && user.email.includes('@')
                      ? user.email.split('@')[0]
                      : user?.email || 'You')}
                </div>
                {showVisibilityToggle && (
                  <button
                    onClick={() => setIsOptionsSheetOpen(true)}
                    className="flex items-center gap-1 text-xs text-gray-700 hover:text-gray-700 mt-1 min-h-[44px] px-2"
                    aria-expanded={isOptionsSheetOpen}
                    aria-controls="post-options-sheet"
                  >
                    <Globe className="w-3 h-3" />
                    {composer.visibility === 'public' ? 'Public' : 'Private'}
                    <ChevronDown className={`w-3 h-3 transition-transform`} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Main input area - contentEditable for visual formatting */}
          <div className="relative">
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              data-placeholder={fullScreen ? "What's happening?" : placeholder}
              className={cn(
                'w-full border-0 bg-transparent',
                'focus:outline-none focus:ring-0',
                'leading-relaxed break-words',
                'max-h-[60vh] overflow-y-auto',
                'empty:before:content-[attr(data-placeholder)]',
                'empty:before:text-gray-500',
                'empty:before:pointer-events-none',
                fullScreen
                  ? 'text-xl min-h-[120px]'
                  : compact
                    ? 'text-sm min-h-[40px]'
                    : 'text-base min-h-[60px]',
                composer.isPosting && 'opacity-50 cursor-not-allowed'
              )}
              style={{ fontSize: fullScreen ? '20px' : '16px' }} // Prevent iOS zoom on focus
              suppressContentEditableWarning
              aria-label="Write your post"
              aria-describedby="character-count"
            />

            {/* Character counter */}
            <CharacterCounter
              count={composer.characterCount}
              max={composerOptions.maxLength || 500}
              className="mt-4"
            />
          </div>
        </div>
      </div>

      {/* Project Selection Modal (X-style) */}
      {isOptionsSheetOpen && showProjectSelection && (
        <LazyProjectSelectionModal
          isOpen={isOptionsSheetOpen}
          onClose={() => setIsOptionsSheetOpen(false)}
          projects={composer.userProjects}
          selectedProjects={composer.selectedProjects}
          onToggleProject={composer.toggleProjectSelection}
          loading={composer.loadingProjects}
        />
      )}

      {/* Error/Success Messages */}
      <ComposerMessages
        error={composer.error}
        success={composer.postSuccess}
        onClearError={composer.clearError}
        onRetry={composer.retry}
        retryCount={composer.retryCount}
      />

      {/* Toolbar (X-style) - Only features that exist/are needed */}
      {fullScreen && (
        <div className="flex items-center gap-4 px-4 pt-4 border-t border-gray-200 mt-4">
          {/* Image upload (grayed out - coming soon) */}
          <button
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 cursor-not-allowed rounded-full transition-colors"
            aria-label="Add image (coming soon)"
            title="Image upload (coming soon)"
            disabled
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Text formatting toolbar */}
          <TextFormatToolbar onFormat={handleFormat} variant="orange" size="md" />
        </div>
      )}

      {/* Action Bar (non-fullscreen) */}
      {!fullScreen && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {/* Options toggle (mobile) */}
            {!compact && (
              <button
                onClick={() => setIsOptionsSheetOpen(true)}
                className="text-gray-700 hover:text-gray-700 p-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Show post options"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            )}

            {/* Project indicator */}
            {composer.selectedProjects.length > 0 && (
              <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                {composer.selectedProjects.length} project
                {composer.selectedProjects.length > 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Cancel button */}
            {onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={composer.isPosting}
                className="text-gray-600"
              >
                Cancel
              </Button>
            )}

            {/* Post button */}
            <Button
              onClick={composer.handlePost}
              disabled={!composer.canPost}
              className={cn(
                'bg-gradient-to-r from-orange-500 to-yellow-500',
                'hover:from-orange-600 hover:to-yellow-600',
                'disabled:from-gray-300 disabled:to-gray-300',
                'text-white px-6 py-2 rounded-full font-semibold',
                'transition-all shadow-sm hover:shadow-md',
                'disabled:shadow-none min-h-[44px] min-w-[80px]',
                compact && 'px-4 py-2 text-sm'
              )}
              aria-label={composer.isPosting ? 'Posting...' : `Post ${buttonText}`}
            >
              {composer.isPosting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Posting...</span>
                </div>
              ) : (
                buttonText
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Loading state for projects */}
      {composer.loadingProjects && (
        <div className="mt-2 text-xs text-gray-700">Loading your projects...</div>
      )}

      {/* Keyboard hint (desktop only, non-fullscreen) */}
      {!fullScreen && (
        <div className="hidden sm:block mt-2 text-xs text-gray-400 text-center">
          Press Ctrl+Enter to post
        </div>
      )}
    </>
  );

  // Full-screen mode: render in BottomSheet
  if (fullScreen) {
    return (
      <BottomSheet
        isOpen={isOpen !== undefined ? isOpen : true}
        onClose={onClose || onCancel || (() => {})}
        maxHeight="100vh"
        showCloseButton={false}
        closeOnOverlayClick={true}
      >
        {renderComposerContent()}
      </BottomSheet>
    );
  }

  // Inline mode: render in Card (existing behavior)
  return (
    <Card
      className={cn(
        'border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50/30 via-white to-yellow-50/20',
        'shadow-sm hover:shadow-md transition-all duration-200',
        compact ? 'rounded-lg' : 'rounded-xl'
      )}
    >
      <CardContent className={cn('p-4', compact && 'p-3')}>{renderComposerContent()}</CardContent>
    </Card>
  );
};

export default PostComposerMobile;
