'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Globe, Lock, X, ChevronDown, Check } from 'lucide-react';
import { usePostComposer, type PostComposerOptions } from '@/hooks/usePostComposerNew';

/**
 * MOBILE-FIRST Post Composer Component
 *
 * Designed for touch-first interaction with progressive enhancement for larger screens.
 * Features: Bottom sheet UI, touch-optimized controls, offline support, auto-save drafts
 */

export interface PostComposerMobileProps extends PostComposerOptions {
  placeholder?: string;
  buttonText?: string;
  showVisibilityToggle?: boolean;
  showProjectSelection?: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
  compact?: boolean; // Compact mode for timeline integration
}

const PostComposerMobile: React.FC<PostComposerMobileProps> = ({
  placeholder = "What's on your mind?",
  buttonText = 'Post',
  showVisibilityToggle = true,
  showProjectSelection = false,
  autoFocus = false,
  onCancel,
  compact = false,
  ...composerOptions
}) => {
  const { user } = useAuth();
  const composer = usePostComposer({
    ...composerOptions,
    allowProjectSelection: showProjectSelection,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);

  // Auto-focus on mount (mobile-friendly)
  useEffect(() => {
    if (autoFocus && textareaRef.current && !compact) {
      // Delay focus for mobile keyboards
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [autoFocus, compact]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [composer.content]);

  // Handle keyboard shortcuts (desktop enhancement)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      composer.handlePost();
    }
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  return (
    <Card
      className={`
      border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50/30 via-white to-yellow-50/20
      shadow-sm hover:shadow-md transition-all duration-200
      ${compact ? 'rounded-lg' : 'rounded-xl'}
    `}
    >
      <CardContent className={`p-4 ${compact ? 'p-3' : ''}`}>
        {/* Header with user info (only in non-compact mode) */}
        {!compact && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.name || 'User avatar'}
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <span className="text-white font-semibold text-sm">
                    {(user?.user_metadata?.name || user?.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">
                {user?.user_metadata?.name || user?.email?.split('@')[0] || 'You'}
              </div>
              {showVisibilityToggle && (
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-1 min-h-[44px] px-2"
                  aria-expanded={showOptions}
                  aria-controls="post-options"
                >
                  <Globe className="w-3 h-3" />
                  {composer.visibility === 'public' ? 'Public' : 'Private'}
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${showOptions ? 'rotate-180' : ''}`}
                  />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main input area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={composer.content}
            onChange={e => composer.setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`
              w-full border-0 resize-none bg-transparent text-base placeholder-gray-500
              focus:outline-none focus:ring-0 min-h-[60px] max-h-[120px]
              ${compact ? 'text-sm min-h-[40px] max-h-[80px]' : ''}
            `}
            maxLength={composerOptions.maxLength || 500}
            disabled={composer.isPosting}
            aria-label="Write your post"
            aria-describedby="character-count"
          />

          {/* Character counter (mobile-friendly positioning) */}
          <div
            id="character-count"
            className={`
              absolute bottom-2 right-2 text-xs font-medium
              ${
                composer.characterCount > 450
                  ? 'text-red-500'
                  : composer.characterCount > 400
                    ? 'text-orange-500'
                    : 'text-gray-400'
              }
            `}
          >
            {composer.characterCount}/{composerOptions.maxLength || 500}
          </div>
        </div>

        {/* Options Panel (collapsible on mobile) */}
        {showOptions && (
          <div id="post-options" className="mt-4 p-3 bg-gray-50 rounded-lg space-y-3">
            {/* Visibility Toggle */}
            {showVisibilityToggle && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Visibility</span>
                <div className="flex bg-white rounded-lg p-1 border">
                  <button
                    onClick={() => composer.setVisibility('public')}
                    className={`flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                      composer.visibility === 'public'
                        ? 'bg-orange-100 text-orange-800'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    aria-pressed={composer.visibility === 'public'}
                  >
                    <Globe className="w-4 h-4" />
                    Public
                  </button>
                  <button
                    onClick={() => composer.setVisibility('private')}
                    className={`flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                      composer.visibility === 'private'
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    aria-pressed={composer.visibility === 'private'}
                  >
                    <Lock className="w-4 h-4" />
                    Private
                  </button>
                </div>
              </div>
            )}

            {/* Project Selection */}
            {showProjectSelection && composer.userProjects.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowProjectSelector(!showProjectSelector)}
                  className="flex items-center justify-between w-full text-sm font-medium text-gray-700 min-h-[44px] py-3"
                  aria-expanded={showProjectSelector}
                >
                  Also post to projects{' '}
                  {composer.selectedProjects.length > 0 && `(${composer.selectedProjects.length})`}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showProjectSelector ? 'rotate-180' : ''}`}
                  />
                </button>

                {showProjectSelector && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {composer.userProjects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => composer.toggleProjectSelection(project.id)}
                        className={`
                          flex items-center gap-3 w-full p-3 rounded-lg border transition-colors
                          ${
                            composer.selectedProjects.includes(project.id)
                              ? 'bg-orange-50 border-orange-200'
                              : 'bg-white border-gray-200 hover:border-orange-300'
                          }
                        `}
                        disabled={composer.isPosting}
                      >
                        <div
                          className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center
                          ${
                            composer.selectedProjects.includes(project.id)
                              ? 'bg-orange-500 border-orange-500'
                              : 'border-gray-300'
                          }
                        `}
                        >
                          {composer.selectedProjects.includes(project.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-gray-900">{project.title}</div>
                          {project.description && (
                            <div className="text-xs text-gray-500 truncate">
                              {project.description}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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
              <button
                onClick={composer.retry}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {composer.postSuccess && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-700 text-sm">✓ Post shared successfully!</div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {/* Options toggle (mobile) */}
            {!compact && !showOptions && (
              <button
                onClick={() => setShowOptions(true)}
                className="text-gray-500 hover:text-gray-700 p-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
              className={`
                bg-gradient-to-r from-orange-500 to-yellow-500
                hover:from-orange-600 hover:to-yellow-600
                disabled:from-gray-300 disabled:to-gray-300
                text-white px-6 py-2 rounded-full font-semibold
                transition-all shadow-sm hover:shadow-md
                disabled:shadow-none min-h-[44px] min-w-[80px]
                ${compact ? 'px-4 py-2 text-sm' : ''}
              `}
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

        {/* Loading state for projects */}
        {composer.loadingProjects && (
          <div className="mt-2 text-xs text-gray-500">Loading your projects...</div>
        )}

        {/* Keyboard hint (desktop only) */}
        <div className="hidden sm:block mt-2 text-xs text-gray-400 text-center">
          Press Ctrl+Enter to post
        </div>
      </CardContent>
    </Card>
  );
};

export default PostComposerMobile;
