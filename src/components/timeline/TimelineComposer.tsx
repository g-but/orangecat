'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Globe, Lock } from 'lucide-react';
import { usePostComposer } from '@/hooks/usePostComposer';

/**
 * TimelineComposer Component - Modular Post Creation
 *
 * Reusable composer for creating timeline posts.
 * Supports posting to:
 * - Own timeline (journey)
 * - Other profiles
 * - Projects
 * - Optional cross-posting to additional project timelines
 */

export interface TimelineComposerProps {
  // Target timeline (where the post will appear)
  targetOwnerId?: string; // Profile ID or Project ID
  targetOwnerType?: 'profile' | 'project';
  targetOwnerName?: string; // Display name for context

  // Feature flags
  allowProjectSelection?: boolean; // Allow selecting additional projects to cross-post

  // Callbacks
  onPostCreated?: () => void;
  onCancel?: () => void;

  // UI customization
  placeholder?: string;
  buttonText?: string;
  showBanner?: boolean; // Show banner when posting to someone else's timeline
}

/**
 * TimelineComposer - Universal Post Creation Component
 */
export default function TimelineComposer({
  targetOwnerId,
  targetOwnerType = 'profile',
  targetOwnerName,
  allowProjectSelection = false,
  onPostCreated,
  onCancel,
  placeholder,
  buttonText = 'Share',
  showBanner = true,
}: TimelineComposerProps) {
  const { user } = useAuth();

  // Use the post composer hook
  const postComposer = usePostComposer({
    subjectType: targetOwnerType,
    subjectId: targetOwnerId,
    allowProjectSelection,
    onSuccess: onPostCreated,
  });

  // Determine if posting to own timeline
  const postingToOwnTimeline = !targetOwnerId || targetOwnerId === user?.id;
  const targetName = targetOwnerName || (postingToOwnTimeline ? 'your timeline' : 'this timeline');

  // Default placeholder
  const defaultPlaceholder = postingToOwnTimeline
    ? "What's on your mind?"
    : `Write on ${targetName}...`;

  // Project loading is now handled by the usePostComposer hook

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      postComposer.handlePost();
    }
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  return (
    <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50/30 via-white to-yellow-50/20 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Timeline Context Banner */}
        {showBanner && !postingToOwnTimeline && (
          <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm">
            <span className="text-blue-700 font-medium">✍️ Posting on {targetName}</span>
            <span className="text-blue-500 text-xs">(Your post will appear on their timeline)</span>
          </div>
        )}

        <div className="flex gap-3">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata.name || 'User'}
                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-white font-semibold text-base">
                  {(user?.user_metadata?.name || user?.email || 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Post Input */}
          <div className="flex-1 min-w-0">
            <textarea
              value={postComposer.content}
              onChange={e => {
                postComposer.setContent(e.target.value);
                // Clear error when user starts typing
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || defaultPlaceholder}
              className="w-full border-0 resize-none text-lg placeholder-gray-500 focus:outline-none bg-transparent"
              rows={3}
              maxLength={500}
              disabled={isPosting}
            />

            {/* Project Selection */}
            {allowProjectSelection && postComposer.userProjects.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Also post to projects (optional):
                </label>
                <div className="flex flex-wrap gap-2">
                  {postComposer.userProjects.map(project => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => postComposer.toggleProjectSelection(project.id)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        postComposer.selectedProjects.includes(project.id)
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-orange-300'
                      }`}
                      disabled={postComposer.isPosting}
                    >
                      {project.title}
                    </button>
                  ))}
                </div>
                {postComposer.selectedProjects.length > 0 && (
                  <p className="mt-2 text-xs text-gray-600">
                    This post will appear on {postComposer.selectedProjects.length} project timeline
                    {postComposer.selectedProjects.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
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

            {/* Post Actions */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Visibility Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    postComposer.setVisibility(
                      postComposer.visibility === 'public' ? 'private' : 'public'
                    )
                  }
                  disabled={postComposer.isPosting}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium transition-colors border disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor:
                      postComposer.visibility === 'public'
                        ? 'rgb(254 249 195)'
                        : 'rgb(243 244 246)',
                    borderColor:
                      postComposer.visibility === 'public' ? 'rgb(251 191 36)' : 'rgb(209 213 219)',
                    color:
                      postComposer.visibility === 'public' ? 'rgb(146 64 14)' : 'rgb(75 85 99)',
                  }}
                  title={
                    postComposer.visibility === 'public' ? 'Everyone can see' : 'Only you can see'
                  }
                >
                  {postComposer.visibility === 'public' ? (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      <span>Public</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Private</span>
                    </>
                  )}
                </button>

                {/* Character Count */}
                <div
                  className={`text-sm font-medium ${
                    postComposer.content.length > 450
                      ? 'text-red-500'
                      : postComposer.content.length > 400
                        ? 'text-orange-500'
                        : 'text-gray-500'
                  }`}
                >
                  {postComposer.content.length}/500
                </div>

                {/* Keyboard Hint */}
                <div className="text-xs text-gray-400 hidden sm:block">Ctrl+Enter to post</div>
              </div>

              <div className="flex gap-2">
                {onCancel && (
                  <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={postComposer.isPosting}
                    size="sm"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={postComposer.handlePost}
                  disabled={
                    !postComposer.content.trim() ||
                    postComposer.isPosting ||
                    postComposer.content.length > 500
                  }
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:from-gray-300 disabled:to-gray-300 text-white px-6 py-2 rounded-full font-semibold transition-all shadow-sm hover:shadow-md disabled:shadow-none"
                  size="sm"
                >
                  {postComposer.isPosting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Posting...
                    </span>
                  ) : (
                    buttonText
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
