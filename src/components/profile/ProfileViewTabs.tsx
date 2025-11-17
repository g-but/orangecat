'use client';

import { useState, ReactNode } from 'react';
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
 */
export default function ProfileViewTabs({ tabs, defaultTab, className }: ProfileViewTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set([defaultTab || tabs[0]?.id]));

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);

    // Mark tab as loaded for progressive exposure
    if (!loadedTabs.has(tabId)) {
      setLoadedTabs(new Set([...loadedTabs, tabId]));
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.icon && (
                  <span
                    className={cn(
                      'mr-2 transition-colors',
                      isActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  >
                    {tab.icon}
                  </span>
                )}
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      'ml-2 py-0.5 px-2 rounded-full text-xs font-medium',
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
      <div className="py-4">
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
