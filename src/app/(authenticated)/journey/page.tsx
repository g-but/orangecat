'use client';

import React from 'react';
import TwitterTimeline from '@/components/timeline/TwitterTimeline';
import { BookOpen, Plus } from 'lucide-react';

/**
 * My Journey Page - Personal Timeline
 *
 * Uses the unified TwitterTimeline component with personal mode.
 * Identical interface to Community page but shows user's own posts.
 *
 * Built with best practices: DRY, maintainable, modular, high quality code
 */
export default function MyJourneyPage() {
  return (
    <TwitterTimeline
      title="My Journey"
      description="Your personal timeline and story"
      icon={BookOpen}
      gradientFrom="from-orange-50/30"
      gradientVia="via-white"
      gradientTo="to-yellow-50/20"
      mode="journey"
      showShareButton={true}
      shareButtonText="Share Update"
      shareButtonIcon={Plus}
      defaultSort="recent"
      showSortingControls={false}
      showInlineComposer={true}
    />
  );
}
