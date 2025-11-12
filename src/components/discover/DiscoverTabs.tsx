'use client';

import { motion } from 'framer-motion';
import { Target, Users, Grid3X3 } from 'lucide-react';

export type DiscoverTabType = 'all' | 'projects' | 'profiles';

interface DiscoverTabsProps {
  activeTab: DiscoverTabType;
  onTabChange: (tab: DiscoverTabType) => void;
  projectCount: number;
  profileCount: number;
  loading?: boolean;
}

interface TabConfig {
  id: DiscoverTabType;
  label: string;
  icon: React.ReactNode;
  getCount: (projectCount: number, profileCount: number) => number;
}

const tabs: TabConfig[] = [
  {
    id: 'all',
    label: 'All',
    icon: <Grid3X3 className="w-4 h-4" />,
    getCount: (p, pr) => p + pr,
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: <Target className="w-4 h-4" />,
    getCount: (p) => p,
  },
  {
    id: 'profiles',
    label: 'People',
    icon: <Users className="w-4 h-4" />,
    getCount: (_, pr) => pr,
  },
];

export default function DiscoverTabs({
  activeTab,
  onTabChange,
  projectCount,
  profileCount,
  loading = false,
}: DiscoverTabsProps) {
  return (
    <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm rounded-t-2xl sticky top-0 z-10">
      <nav className="-mb-px flex space-x-8 px-6 pt-4" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tab.getCount(projectCount, profileCount);

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group relative inline-flex items-center gap-2 px-1 py-3 text-sm font-medium
                transition-colors duration-200
                ${
                  isActive
                    ? 'text-orange-600'
                    : 'text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Icon */}
              <span
                className={`
                transition-colors duration-200
                ${isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}
              `}
              >
                {tab.icon}
              </span>

              {/* Label */}
              <span>{tab.label}</span>

              {/* Count Badge */}
              {!loading && count > 0 && (
                <span
                  className={`
                    inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full
                    transition-colors duration-200
                    ${
                      isActive
                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 group-hover:bg-gray-200'
                    }
                  `}
                >
                  {count}
                </span>
              )}

              {/* Active indicator line */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
