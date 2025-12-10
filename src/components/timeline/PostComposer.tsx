'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/hooks/useAuth';
import AvatarLink from '@/components/ui/AvatarLink';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/useToast';
import { Send, Image, MapPin, Hash, Smile } from 'lucide-react';

interface PostComposerProps {
  onPostCreated?: (event: any) => void;
  placeholder?: string;
  compact?: boolean;
}

export function PostComposer({ onPostCreated, placeholder = "What's happening?", compact = false }: PostComposerProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { success, error } = useToast();

  const handleSubmit = async () => {
    if (!content.trim() || isPosting || !user) return;

    setIsPosting(true);
    try {
      const result = await timelineService.createEvent({
        eventType: 'status_update',
        actorId: user.id,
        subjectType: 'profile',
        subjectId: user.id,
        description: content.trim(),
        visibility: 'public',
      });

      if (result.success) {
        setContent('');
        onPostCreated?.(result.event);
        logger.info('Successfully created post', null, 'PostComposer');
        success('Post created successfully!');
      } else {
        logger.error('Failed to create post', result.error, 'PostComposer');
        error(result.error || 'Failed to create post');
      }
    } catch (error) {
      logger.error('Error creating post', error, 'PostComposer');
      error('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!user) return null;

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <AvatarLink
            username={profile?.username}
            userId={user.id}
            avatarUrl={profile?.avatar_url}
            name={profile?.name || user.email}
            size={compact ? 32 : 40}
            className="flex-shrink-0"
          />

          {/* Composer */}
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="min-h-[120px] resize-none border-none shadow-none focus:ring-0 text-lg placeholder:text-gray-500"
              onKeyDown={handleKeyDown}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                {/* Media upload placeholder */}
                <button
                  type="button"
                  className="text-gray-500 hover:text-blue-500 p-2 rounded-full hover:bg-blue-50 transition-colors"
                  title="Add media"
                >
                  <Image className="w-5 h-5" />
                </button>

                {/* Location placeholder */}
                <button
                  type="button"
                  className="text-gray-500 hover:text-blue-500 p-2 rounded-full hover:bg-blue-50 transition-colors"
                  title="Add location"
                >
                  <MapPin className="w-5 h-5" />
                </button>

                {/* Hashtags placeholder */}
                <button
                  type="button"
                  className="text-gray-500 hover:text-blue-500 p-2 rounded-full hover:bg-blue-50 transition-colors"
                  title="Add hashtags"
                >
                  <Hash className="w-5 h-5" />
                </button>

                {/* Emoji placeholder */}
                <button
                  type="button"
                  className="text-gray-500 hover:text-blue-500 p-2 rounded-full hover:bg-blue-50 transition-colors"
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>

              {/* Post Button */}
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || isPosting}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold"
              >
                {isPosting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Posting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Post
                  </div>
                )}
              </Button>
            </div>

            {/* Character count */}
            <div className="text-right mt-2">
              <span className={`text-sm ${content.length > 280 ? 'text-red-500' : 'text-gray-500'}`}>
                {content.length}/280
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}