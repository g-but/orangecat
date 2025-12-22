'use client';

import { useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface ProfileTab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  badge?: string | number;
}

interface ProfileViewTabsProps {
  tabs: ProfileTab[];
  defaultTab?: string;
  className?: string;
}

/**
 * ProfileViewTabs Component
 *
 * Modular tab navigation for public profile viewing following best practices:
 * - DRY: Reusable across different profile types
 * - Modular: Each tab is independent
 * - Progressive: Lazy loads tab content on first click
 * - Mobile-optimized: X/Twitter-style horizontal scrollable tabs on mobile
 */
export default function ProfileViewTabs({ tabs, defaultTab, className }: ProfileViewTabsProps) {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams?.get('tab');
  const navRef = useRef<HTMLElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Keep original tab order - don't sort
  // Determine initial tab: URL param > defaultTab > 'timeline' > first tab
  const initialTab =
    tabFromUrl && tabs.some(t => t.id === tabFromUrl)
      ? tabFromUrl
      : defaultTab || tabs.find(t => t.id === 'timeline')?.id || tabs[0]?.id;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set([initialTab]));

  // Update active tab when URL changes
  useEffect(() => {
    if (tabFromUrl && tabs.some(t => t.id === tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
      if (!loadedTabs.has(tabFromUrl)) {
        setLoadedTabs(new Set([...loadedTabs, tabFromUrl]));
      }
    }
  }, [tabFromUrl, tabs, activeTab, loadedTabs]);

  // Check scroll position and update fade indicators
  const updateScrollIndicators = useCallback(() => {
    if (!navRef.current) {
      return;
    }
    const nav = navRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = nav;

    setShowLeftFade(scrollLeft > 0);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (activeTabRef.current && navRef.current) {
      const nav = navRef.current;
      const button = activeTabRef.current;
      const navRect = nav.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();

      // Only scroll on mobile (when nav is scrollable)
      if (nav.scrollWidth > nav.clientWidth) {
        const scrollLeft = nav.scrollLeft;
        const buttonLeft = buttonRect.left - navRect.left + scrollLeft;
        const buttonRight = buttonLeft + buttonRect.width;
        const navWidth = nav.clientWidth;

        // Scroll if button is outside visible area
        if (buttonLeft < scrollLeft) {
          nav.scrollTo({ left: buttonLeft - 16, behavior: 'smooth' });
        } else if (buttonRight > scrollLeft + navWidth) {
          nav.scrollTo({ left: buttonRight - navWidth + 16, behavior: 'smooth' });
        }
      }

      // Update indicators after scroll
      setTimeout(updateScrollIndicators, 100);
    }
  }, [activeTab, updateScrollIndicators]);

  // Update scroll indicators on mount and resize
  useEffect(() => {
    updateScrollIndicators();
    const nav = navRef.current;
    if (nav) {
      nav.addEventListener('scroll', updateScrollIndicators);
      window.addEventListener('resize', updateScrollIndicators);
      return () => {
        nav.removeEventListener('scroll', updateScrollIndicators);
        window.removeEventListener('resize', updateScrollIndicators);
      };
    }
  }, [updateScrollIndicators, tabs]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);

    // Mark tab as loaded for progressive exposure
    if (!loadedTabs.has(tabId)) {
      setLoadedTabs(new Set([...loadedTabs, tabId]));
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Navigation - X/Twitter-style horizontal scroll on mobile, flex on desktop */}
      <div className="border-b border-gray-200 mb-4 sm:mb-6 relative">
        {/* Left fade indicator - only on mobile when scrolled */}
        {showLeftFade && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10 sm:hidden" />
        )}
        {/* Right fade indicator - only on mobile when more tabs available */}
        {showRightFade && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 sm:hidden" />
        )}
        <nav
          ref={navRef}
          onScroll={updateScrollIndicators}
          className="-mb-px flex space-x-0 sm:space-x-3 md:space-x-6 lg:space-x-8 overflow-x-auto scrollbar-hide scroll-smooth touch-pan-x"
          aria-label="Tabs"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={isActive ? activeTabRef : null}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'group inline-flex items-center justify-center sm:justify-start py-2.5 sm:py-3 lg:py-4 px-3 sm:px-1 md:px-2 border-b-2 font-medium text-sm sm:text-sm transition-colors whitespace-nowrap touch-manipulation min-h-[44px] flex-shrink-0',
                  isActive
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.icon && (
                  <span
                    className={cn(
                      'mr-1.5 sm:mr-2 transition-colors flex-shrink-0',
                      isActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  >
                    {tab.icon}
                  </span>
                )}
                <span className="truncate">{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      'ml-1.5 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0',
                      isActive ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content - Progressive Loading */}
      <div className="py-2 sm:py-4">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const hasLoaded = loadedTabs.has(tab.id);

          // Only render content if tab has been loaded
          if (!hasLoaded) {
            return null;
          }

          return (
            <div
              key={tab.id}
              className={cn('transition-opacity duration-200', isActive ? 'block' : 'hidden')}
              role="tabpanel"
              aria-labelledby={`tab-${tab.id}`}
            >
              {tab.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
