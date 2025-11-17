'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TwitterTimeline from '@/components/timeline/TwitterTimeline';
import { BookOpen, Plus } from 'lucide-react';

/**
 * My Journey Page - Personal Timeline
 *
 * Uses the unified TwitterTimeline component with personal mode.
 * Identical interface to Community page but shows user's own posts.
 *
 * Handles URL params:
 * - ?compose=true: Auto-expands the post composer
 *
 * Built with best practices: DRY, maintainable, modular, high quality code
 */
export default function MyJourneyPage() {
  const searchParams = useSearchParams();
  const [shouldAutoExpand, setShouldAutoExpand] = useState(false);

  useEffect(() => {
    // Check if compose=true is in URL
    if (searchParams.get('compose') === 'true') {
      setShouldAutoExpand(true);
      // Clear the URL param after detecting it (optional)
      // This prevents the composer from reopening if the user navigates away and back
      const url = new URL(window.location.href);
      url.searchParams.delete('compose');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

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
