'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import { Globe, Lock, FolderPlus, X, Bold, Italic } from 'lucide-react';
import { usePostComposer } from '@/hooks/usePostComposerNew';
import AvatarLink from '@/components/ui/AvatarLink';
import { cn } from '@/lib/utils';
import { markdownToHtml, htmlToMarkdown, getSelectionRange, setSelectionRange } from '@/utils/markdownEditor';

/**
 * TimelineComposer Component - X-Inspired Minimal Design
 *
 * Clean, minimal composer inspired by X (Twitter) design principles.
 * Features:
 * - Minimal visual weight (no heavy cards/gradients)
 * - Progressive disclosure (collapsible project selection)
 * - Basic text formatting (bold/italic via markdown)
 * - Modular, maintainable, DRY code
 */

export interface TimelineComposerProps {
  targetOwnerId?: string;
  targetOwnerType?: 'profile' | 'project';
  targetOwnerName?: string;
  allowProjectSelection?: boolean;
  onPostCreated?: (event?: any) => void;
  onOptimisticUpdate?: (event: any) => void;
  onCancel?: () => void;
  placeholder?: string;
  buttonText?: string;
  showBanner?: boolean;
}

/**
 * Text Formatting Toolbar Component
 * 
 * Modular component for applying markdown-style formatting (bold/italic)
 * Uses markdown syntax: **bold** and *italic*
 */
function TextFormatToolbar({
  textareaRef,
  onFormat,
  content,
}: {
  textareaRef: React.RefObject<HTMLElement>;
  onFormat: (format: 'bold' | 'italic') => void;
  content: string;
}) {
  if (!content) return null;

  return (
    <div className="flex items-center gap-1 sm:gap-0.5 mt-2">
      <button
        type="button"
        onClick={() => onFormat('bold')}
        className="p-3 sm:p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 hover:bg-orange-50 active:bg-orange-100 rounded-full text-gray-400 hover:text-orange-500 transition-colors touch-manipulation"
        title="Bold (Ctrl+B)"
        aria-label="Make text bold"
      >
        <Bold className="w-4 h-4 sm:w-4 sm:h-4" />
      </button>
      <button
        type="button"
        onClick={() => onFormat('italic')}
        className="p-3 sm:p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 hover:bg-orange-50 active:bg-orange-100 rounded-full text-gray-400 hover:text-orange-500 transition-colors touch-manipulation"
        title="Italic (Ctrl+I)"
        aria-label="Make text italic"
      >
        <Italic className="w-4 h-4 sm:w-4 sm:h-4" />
      </button>
    </div>
  );
}

/**
 * Project Selection Panel Component
 * 
 * Collapsible panel for selecting projects to cross-post
 * Uses progressive disclosure - hidden by default
 */
function ProjectSelectionPanel({
  projects,
  selectedProjects,
  onToggle,
  onClose,
  isPosting,
}: {
  projects: Array<{ id: string; title: string }>;
  selectedProjects: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
  isPosting: boolean;
}) {
  if (projects.length === 0) return null;

  return (
    <div className="mt-3 p-3 bg-orange-50/50 rounded-xl border border-orange-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-orange-800 uppercase tracking-wide">
          Cross-post to Projects
        </span>
        <button
          onClick={onClose}
          className="text-orange-400 hover:text-orange-600 active:text-orange-700 transition-colors p-2 sm:p-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-full touch-manipulation"
          aria-label="Close project selection"
        >
          <X className="w-4 h-4 sm:w-3 sm:h-3" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {projects.map(project => (
          <button
            key={project.id}
            type="button"
            onClick={() => onToggle(project.id)}
            disabled={isPosting}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full border transition-all',
              selectedProjects.includes(project.id)
                ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
            )}
          >
            {project.title}
          </button>
        ))}
      </div>
      {selectedProjects.length > 0 && (
        <p className="mt-2 text-xs text-gray-600">
          This post will appear on {selectedProjects.length} project timeline
          {selectedProjects.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

/**
 * Context Indicator Component
 * 
 * Subtle indicator showing where the post will appear
 * Replaces the large banner with minimal design
 */
function ContextIndicator({ targetName }: { targetName: string }) {
  return (
    <div className="mb-1.5 flex items-center">
      <span className="text-xs sm:text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 sm:py-0.5 rounded-full">
        To {targetName}
      </span>
    </div>
  );
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
}: TimelineComposerProps) {
  const { user, profile } = useAuth();
  const [showProjects, setShowProjects] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [isComposing, setIsComposing] = useState(false);

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

  // Sync markdown content to HTML in editor (only when not actively composing)
  useEffect(() => {
    if (!editorRef.current || isComposing) return;
    
    const currentHtml = editorRef.current.innerHTML.replace(/\s+/g, ' ').trim();
    const expectedHtml = markdownToHtml(postComposer.content).replace(/\s+/g, ' ').trim();
    
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
  }, [postComposer.content, isComposing]);

  // Formatting handler - uses document.execCommand for contentEditable
  const handleFormat = useCallback((format: 'bold' | 'italic') => {
    if (!editorRef.current) return;

    // Focus editor if not already focused
    editorRef.current.focus();

    // Use document.execCommand for formatting (works with contentEditable)
    // Note: execCommand is deprecated but still widely supported
    const command = format === 'bold' ? 'bold' : 'italic';
    document.execCommand(command, false);
    
    // Sync back to markdown after a brief delay to let browser update
    setTimeout(() => {
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        const markdown = htmlToMarkdown(html);
        postComposer.setContent(markdown);
      }
    }, 0);
  }, [postComposer]);

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
        if (markdown !== postComposer.content) {
          postComposer.setContent(markdown);
        }
        
        // Auto-resize
        editorRef.current.style.height = 'auto';
        editorRef.current.style.height = `${Math.min(editorRef.current.scrollHeight, 200)}px`;
      }
      setIsComposing(false);
    }, 10);
  }, [postComposer]);

  // Handle keyboard shortcuts (desktop only - mobile keyboards don't have Ctrl/Cmd)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Ctrl/Cmd + Enter to post (desktop only)
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!postComposer.isPosting && postComposer.content.trim()) {
        postComposer.handlePost();
      }
    }
    // Escape to cancel
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
    // Ctrl/Cmd + B for bold (desktop only)
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      handleFormat('bold');
    }
    // Ctrl/Cmd + I for italic (desktop only)
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      handleFormat('italic');
    }
  }, [postComposer, onCancel, handleFormat]);

  // Project selection handlers
  const handleToggleProject = useCallback((id: string) => {
    postComposer.toggleProjectSelection(id);
  }, [postComposer]);

  const handleCloseProjects = useCallback(() => {
    setShowProjects(false);
  }, []);

  const handleOpenProjects = useCallback(() => {
    setShowProjects(true);
  }, []);

  // Character count color
  const characterCountColor = useMemo(() => {
    if (postComposer.content.length > 450) return 'text-red-500';
    if (postComposer.content.length > 400) return 'text-orange-500';
    return 'text-gray-400';
  }, [postComposer.content.length]);

  // Button disabled state
  const isButtonDisabled = useMemo(
    () =>
      !postComposer.content.trim() ||
      postComposer.isPosting ||
      postComposer.content.length > 500,
    [postComposer.content, postComposer.isPosting]
  );

  return (
    <div className="border-b border-gray-200 bg-white px-3 sm:px-4 py-3 transition-all safe-area-padding-x">
      <div className="flex gap-2 sm:gap-3">
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
          {!postingToOwnTimeline && showBanner && (
            <ContextIndicator targetName={targetName} />
            )}

          {/* ContentEditable Input - Shows formatted text inline (like X) */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
              onKeyDown={handleKeyDown}
            data-placeholder={placeholder || defaultPlaceholder}
            className={cn(
              'w-full min-h-[3rem] sm:min-h-[3rem] text-base sm:text-lg',
              'border-none bg-transparent p-0 focus:outline-none',
              'leading-relaxed break-words',
              'empty:before:content-[attr(data-placeholder)]',
              'empty:before:text-gray-400',
              'empty:before:pointer-events-none',
              postComposer.isPosting && 'opacity-50 cursor-not-allowed'
            )}
            style={{ fontSize: '16px' }} // Prevent iOS zoom on focus
            suppressContentEditableWarning
            />

          {/* Text Formatting Toolbar */}
          <TextFormatToolbar
            textareaRef={editorRef as any}
            onFormat={handleFormat}
            content={postComposer.content}
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
            {postComposer.error && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {postComposer.error}
              </div>
            )}
            {postComposer.postSuccess && (
              <div className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                ✓ Post shared successfully!
              </div>
            )}

          {/* Bottom Toolbar - Mobile optimized */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1 sm:gap-1 text-orange-500">
              {/* Visibility Toggle (Icon only) - 44px touch target */}
                <button
                  type="button"
                  onClick={() =>
                    postComposer.setVisibility(
                      postComposer.visibility === 'public' ? 'private' : 'public'
                    )
                  }
                  disabled={postComposer.isPosting}
                className="p-3 sm:p-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 hover:bg-orange-50 active:bg-orange-100 rounded-full transition-colors text-gray-400 hover:text-orange-500 disabled:opacity-50 touch-manipulation"
                title={
                    postComposer.visibility === 'public'
                    ? 'Public - Everyone can see'
                    : 'Private - Only you can see'
                }
                aria-label={`Post visibility: ${postComposer.visibility}`}
                >
                  {postComposer.visibility === 'public' ? (
                  <Globe className="w-4 h-4 sm:w-4 sm:h-4" />
                  ) : (
                  <Lock className="w-4 h-4 sm:w-4 sm:h-4" />
                  )}
                </button>

              {/* Project Toggle (Icon only) - 44px touch target */}
              {allowProjectSelection && postComposer.userProjects.length > 0 && (
                <button
                  type="button"
                  onClick={showProjects ? handleCloseProjects : handleOpenProjects}
                  className={cn(
                    'p-3 sm:p-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-full transition-colors touch-manipulation',
                    showProjects || postComposer.selectedProjects.length > 0
                      ? 'text-orange-600 bg-orange-100 active:bg-orange-200'
                      : 'text-gray-400 hover:bg-orange-50 active:bg-orange-100 hover:text-orange-500'
                  )}
                  title="Cross-post to Projects"
                  aria-label="Toggle project selection"
                >
                  <FolderPlus className="w-4 h-4 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Subtle Character Count - Larger on mobile */}
              {postComposer.content.length > 0 && (
                <div className={cn('text-sm sm:text-xs font-medium', characterCountColor)}>
                  {postComposer.content.length}/500
                </div>
              )}

              {/* Post Button - Already has 44px min-height from Button component */}
                <Button
                  onClick={postComposer.handlePost}
                  disabled={isButtonDisabled}
                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-full px-5 sm:px-5 py-2 sm:py-1.5 text-sm font-bold shadow-sm disabled:opacity-50 disabled:shadow-none transition-all touch-manipulation"
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
