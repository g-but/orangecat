'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import BottomSheet from '@/components/ui/BottomSheet';
import AvatarLink from '@/components/ui/AvatarLink';
import { Globe, Lock, X, ChevronDown, ArrowLeft, Image, Bold, Italic } from 'lucide-react';
import { usePostComposer, type PostComposerOptions } from '@/hooks/usePostComposerNew';
import { cn } from '@/lib/utils';
import { markdownToHtml, htmlToMarkdown, getSelectionRange, setSelectionRange } from '@/utils/markdownEditor';

/**
 * MOBILE-FIRST Post Composer Component
 *
 * Designed for touch-first interaction with progressive enhancement for larger screens.
 * Features: Bottom sheet UI, touch-optimized controls, offline support, auto-save drafts
 * Supports X-style full-screen mode via fullScreen prop
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

  const editorRef = useRef<HTMLDivElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isOptionsSheetOpen, setIsOptionsSheetOpen] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);

  // Preload project selection modal when composer opens (for instant opening)
  const LazyProjectSelectionModal = dynamic(
    () => import('./ProjectSelectionModal').then(module => ({ default: module.default })),
    { ssr: false, loading: () => null }
  );

  // Preload modal component when composer opens
  useEffect(() => {
    if (fullScreen && showProjectSelection) {
      // Preload the modal component so it's ready when user clicks
      import('./ProjectSelectionModal');
    }
  }, [fullScreen, showProjectSelection]);

  // Sync markdown content to HTML in editor (only when not actively composing)
  useEffect(() => {
    if (!editorRef.current || isComposing) return;
    
    const currentHtml = editorRef.current.innerHTML.replace(/\s+/g, ' ').trim();
    const expectedHtml = markdownToHtml(composer.content).replace(/\s+/g, ' ').trim();
    
    // Only update if significantly different (avoid cursor jumping on every keystroke)
    if (currentHtml !== expectedHtml && expectedHtml !== '<br>') {
      const selection = getSelectionRange(editorRef.current);
      const wasFocused = document.activeElement === editorRef.current;
      
      editorRef.current.innerHTML = expectedHtml || '<br>';
      
      // Restore cursor position and focus
      if (selection && wasFocused) {
        requestAnimationFrame(() => {
          if (editorRef.current) {
            try {
              setSelectionRange(editorRef.current, selection.start, selection.end);
              editorRef.current.focus();
            } catch (e) {
              // Fallback: just focus
              editorRef.current.focus();
            }
          }
        });
      }
    }
  }, [composer.content, isComposing]);

  // Auto-focus on mount (mobile-friendly)
  useEffect(() => {
    if (autoFocus && editorRef.current && !compact) {
      // Delay focus for mobile keyboards
      setTimeout(() => editorRef.current?.focus(), 100);
    }
  }, [autoFocus, compact]);

  // Handle input in contentEditable
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    
    setIsComposing(true);
    
    // Debounce the markdown conversion slightly to avoid cursor jumping
    setTimeout(() => {
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        const markdown = htmlToMarkdown(html);
        
        // Only update if different to avoid unnecessary re-renders
        if (markdown !== composer.content) {
          composer.setContent(markdown);
        }
        
        // Auto-resize
        editorRef.current.style.height = 'auto';
        const maxHeight = fullScreen ? 300 : 120;
        editorRef.current.style.height = `${Math.min(editorRef.current.scrollHeight, maxHeight)}px`;
      }
      setIsComposing(false);
    }, 10);
  }, [composer, fullScreen]);

  // Formatting handler - uses document.execCommand for contentEditable
  const handleFormat = useCallback((format: 'bold' | 'italic') => {
    if (!editorRef.current) return;

    // Focus editor if not already focused
    editorRef.current.focus();

    // Use document.execCommand for formatting (works with contentEditable)
    const command = format === 'bold' ? 'bold' : 'italic';
    document.execCommand(command, false);
    
    // Sync back to markdown after a brief delay to let browser update
    setTimeout(() => {
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        const markdown = htmlToMarkdown(html);
        composer.setContent(markdown);
      }
    }, 0);
  }, [composer]);

  // Handle keyboard shortcuts (desktop enhancement)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      composer.handlePost();
    }
    if (e.key === 'Escape') {
      if (onCancel) {
        onCancel();
      } else if (fullScreen && onClose) {
        onClose();
      }
    }
    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      handleFormat('bold');
    }
    // Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      handleFormat('italic');
    }
  };

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
            ) : !compact && (
              <div className="flex-shrink-0">
                {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                  <img
                    src={(profile as any)?.avatar_url || user?.user_metadata?.avatar_url}
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
                    {user?.user_metadata?.name || user?.email?.split('@')[0] || 'You'}
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
                onKeyDown={handleKeyDown}
                data-placeholder={fullScreen ? "What's happening?" : placeholder}
                className={cn(
                  'w-full border-0 bg-transparent',
                  'focus:outline-none focus:ring-0',
                  'leading-relaxed break-words',
                  'empty:before:content-[attr(data-placeholder)]',
                  'empty:before:text-gray-500',
                  'empty:before:pointer-events-none',
                  fullScreen
                    ? 'text-xl min-h-[120px]'
                    : compact
                      ? 'text-sm min-h-[40px] max-h-[80px]'
                      : 'text-base min-h-[60px] max-h-[120px]',
                  composer.isPosting && 'opacity-50 cursor-not-allowed'
                )}
                style={{ fontSize: fullScreen ? '20px' : '16px' }} // Prevent iOS zoom on focus
                suppressContentEditableWarning
                aria-label="Write your post"
                aria-describedby="character-count"
              />

              {/* Character counter */}
              {composer.content.length > 0 && (
                <div
                  id="character-count"
                  className={cn(
                    'mt-4 text-sm font-medium',
                    composer.characterCount > 450
                      ? 'text-red-500'
                      : composer.characterCount > 400
                        ? 'text-orange-500'
                        : 'text-gray-400'
                  )}
                >
                  {composer.characterCount}/{composerOptions.maxLength || 500}
                </div>
              )}
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
        {composer.error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-red-500 text-sm flex-1">{composer.error}</div>
              <button
                onClick={composer.clearError}
                className="text-red-400 hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {composer.retryCount < 3 && (
              <div className="mt-2">
                <button
                  onClick={composer.retry}
                  className="text-sm text-red-600 hover:text-red-800 underline rounded-md min-h-[44px] px-2 flex items-center"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        {composer.postSuccess && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-700 text-sm">✓ Post shared successfully!</div>
          </div>
        )}

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
              <Image className="w-5 h-5" />
            </button>
            
            {/* Bold formatting - uses execCommand for visual formatting */}
            <button 
              onClick={() => handleFormat('bold')}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
              aria-label="Bold"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-5 h-5" />
            </button>
            
            {/* Italic formatting - uses execCommand for visual formatting */}
            <button 
              onClick={() => handleFormat('italic')}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
              aria-label="Italic"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-5 h-5" />
            </button>
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
      <CardContent className={cn('p-4', compact && 'p-3')}>
        {renderComposerContent()}
      </CardContent>
    </Card>
  );
};

export default PostComposerMobile;

