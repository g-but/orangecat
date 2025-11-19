'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Globe, Lock, X, Check, Send, MessageSquare } from 'lucide-react';
import { usePostComposer, type PostComposerOptions } from '@/hooks/usePostComposerNew';

/**
 * UNIFIED POST COMPOSER - Single source of truth for all post creation
 *
 * Features:
 * - Multiple display modes (inline, full, modal)
 * - Responsive design (mobile-first)
 * - Project selection with beautiful UI
 * - Visibility toggle with icons
 * - Character count with visual feedback
 * - Keyboard shortcuts
 * - Auto-save drafts
 * - Error handling and retry logic
 *
 * Replaces: QuickPostWidget, TimelineComposer, PostComposerMobile
 */

export interface UnifiedPostComposerProps extends Omit<PostComposerOptions, 'onSuccess'> {
  // Display mode
  mode?: 'inline' | 'full' | 'modal';

  // UI customization
  placeholder?: string;
  buttonText?: string;
  compact?: boolean;
  showBanner?: boolean; // Show context banner when posting to other timelines

  // Feature toggles
  showVisibilityToggle?: boolean;
  showProjectSelection?: boolean;
  autoFocus?: boolean;

  // Callbacks
  onPostCreated?: (event?: any) => void;
  onCancel?: () => void;
}

const UnifiedPostComposer: React.FC<UnifiedPostComposerProps> = ({
  mode = 'full',
  placeholder,
  buttonText = 'Post',
  compact = false,
  showBanner = true,
  showVisibilityToggle = true,
  showProjectSelection = false,
  autoFocus = false,
  onPostCreated,
  onCancel,
  ...composerOptions
}) => {
  const { user, profile } = useAuth();
  const composer = usePostComposer({
    ...composerOptions,
    allowProjectSelection: showProjectSelection,
    onSuccess: onPostCreated,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isExpanded, setIsExpanded] = useState(mode !== 'inline');
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  // Determine context
  const targetOwnerId = composerOptions.subjectId;
  const targetOwnerType = composerOptions.subjectType || 'profile';
  const postingToOwnTimeline = !targetOwnerId || targetOwnerId === user?.id;

  // Get display info
  const avatar = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'You';

  const defaultPlaceholder = useMemo(
    () => postingToOwnTimeline
      ? "What's on your mind?"
      : `Share your thoughts...`,
    [postingToOwnTimeline]
  );

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && textareaRef.current && isExpanded) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [autoFocus, isExpanded]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && isExpanded) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [composer.content, isExpanded]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      composer.handlePost();
    }
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  }, [composer, onCancel]);

  // Handle post success
  const handlePost = useCallback(async () => {
    await composer.handlePost();
    if (composer.postSuccess && mode === 'inline') {
      setIsExpanded(false);
    }
  }, [composer, mode]);

  // Character count color
  const characterCountColor = useMemo(() => {
    if (composer.characterCount > 450) return 'text-red-600';
    if (composer.characterCount > 400) return 'text-orange-500';
    return 'text-gray-500';
  }, [composer.characterCount]);

  // INLINE MODE - Compact, expands on click
  if (mode === 'inline' && !isExpanded) {
    return (
      <Card className="transition-all hover:shadow-md border-l-4 border-l-orange-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {avatar ? (
                <img
                  src={avatar}
                  alt={displayName}
                  className="w-10 h-10 rounded-full border-2 border-orange-100"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center border-2 border-orange-100">
                  <span className="text-white font-semibold text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Expandable input */}
            <button
              onClick={() => setIsExpanded(true)}
              className="flex-1 text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            >
              {placeholder || defaultPlaceholder}
            </button>

            <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // FULL/MODAL MODE - Complete composer
  return (
    <Card className={`
      border-l-4 border-l-orange-500
      bg-gradient-to-r from-orange-50/30 via-white to-yellow-50/20
      shadow-sm hover:shadow-md transition-all duration-200
      ${compact ? 'rounded-lg' : 'rounded-xl'}
    `}>
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        {/* Context Banner */}
        {showBanner && !postingToOwnTimeline && (
          <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm">
            <span className="text-blue-700 font-medium">
              ✍️ Posting on {targetOwnerType === 'project' ? 'project timeline' : 'their timeline'}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-white font-semibold text-base">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-1 min-w-0">
            {/* Textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={composer.content}
                onChange={e => composer.setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || defaultPlaceholder}
                className={`
                  w-full border-0 resize-none bg-transparent
                  text-base placeholder-gray-500
                  focus:outline-none focus:ring-0
                  min-h-[80px] max-h-[200px]
                  ${compact ? 'text-sm min-h-[60px]' : 'text-lg'}
                `}
                maxLength={500}
                disabled={composer.isPosting}
                aria-label="Write your post"
              />

              {/* Character count */}
              <div className={`absolute bottom-2 right-2 text-xs font-medium ${characterCountColor}`}>
                {composer.characterCount}/500
              </div>
            </div>

            {/* Project Selection */}
            {showProjectSelection && composer.userProjects.length > 0 && (
              <div className="mt-3 p-3 bg-gradient-to-r from-gray-50 to-orange-50/30 rounded-lg border border-gray-200">
                <button
                  onClick={() => setShowProjectPicker(!showProjectPicker)}
                  className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                >
                  <span>
                    Also post to projects {composer.selectedProjects.length > 0 && `(${composer.selectedProjects.length})`}
                  </span>
                  <X
                    className={`w-4 h-4 transition-transform ${showProjectPicker ? 'rotate-45' : 'rotate-0'}`}
                  />
                </button>

                {showProjectPicker && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {composer.userProjects.map(project => {
                      const isSelected = composer.selectedProjects.includes(project.id);
                      return (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => composer.toggleProjectSelection(project.id)}
                          className={`
                            flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border-2
                            transition-all transform hover:scale-105
                            ${isSelected
                              ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-orange-500 shadow-sm'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                            }
                          `}
                          disabled={composer.isPosting}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {project.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Error/Success Messages */}
            {composer.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <p className="text-sm text-red-600 flex-1">{composer.error}</p>
                  <button
                    onClick={composer.clearError}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {composer.postSuccess && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">✓ Post shared successfully!</p>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                {/* Visibility Toggle */}
                {showVisibilityToggle && (
                  <button
                    type="button"
                    onClick={() => composer.setVisibility(composer.visibility === 'public' ? 'private' : 'public')}
                    disabled={composer.isPosting}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                      transition-all border-2 disabled:opacity-50
                      ${composer.visibility === 'public'
                        ? 'bg-yellow-50 border-yellow-400 text-yellow-800 hover:bg-yellow-100'
                        : 'bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                    title={composer.visibility === 'public' ? 'Everyone can see' : 'Only you can see'}
                  >
                    {composer.visibility === 'public' ? (
                      <>
                        <Globe className="w-4 h-4" />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Private</span>
                      </>
                    )}
                  </button>
                )}

                {/* Keyboard hint */}
                <div className="hidden sm:block text-xs text-gray-400 ml-2">
                  Ctrl+Enter to post
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Cancel */}
                {(onCancel || mode === 'inline') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (onCancel) {
                        onCancel();
                      } else if (mode === 'inline') {
                        setIsExpanded(false);
                        composer.reset();
                      }
                    }}
                    disabled={composer.isPosting}
                  >
                    Cancel
                  </Button>
                )}

                {/* Post Button */}
                <Button
                  onClick={handlePost}
                  disabled={!composer.canPost}
                  className={`
                    bg-gradient-to-r from-orange-500 to-yellow-500
                    hover:from-orange-600 hover:to-yellow-600
                    disabled:from-gray-300 disabled:to-gray-300
                    text-white px-6 py-2 rounded-full font-semibold
                    transition-all shadow-sm hover:shadow-md
                    disabled:shadow-none
                    ${compact ? 'px-4 text-sm' : ''}
                  `}
                  size="sm"
                >
                  {composer.isPosting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Posting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      {buttonText}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedPostComposer;
