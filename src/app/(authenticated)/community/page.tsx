'use client';

import React from 'react';
import TwitterTimeline from '@/components/timeline/TwitterTimeline';
import { Globe } from 'lucide-react';

/**
 * Community Timeline Page - Public posts from all users and projects
 *
 * Uses the unified TwitterTimeline component with community mode.
 * Identical interface to My Journey page but shows posts from all users.
 *
 * Built with best practices: DRY, maintainable, modular, high quality code
 */
export default function CommunityPage() {
  return (
    <TwitterTimeline
      title="Community"
      description="Public posts and updates from the OrangeCat community"
      icon={Globe}
      gradientFrom="from-blue-50/30"
      gradientVia="via-white"
      gradientTo="to-purple-50/20"
      mode="community"
      showShareButton={false}
      defaultSort="trending"
      showSortingControls={true}
      showInlineComposer={true}
    />
  );
}
