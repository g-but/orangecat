'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/hooks/useNavigation';
import { navigationSections, bottomNavItems } from '@/config/navigationConfig';
import { SIDEBAR_Z_INDEX, SIDEBAR_TRANSITIONS, SIDEBAR_BREAKPOINTS } from '@/constants/sidebar';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { AuthenticatedHeader } from '@/components/layout/AuthenticatedHeader';
import { DevPerformanceMonitor } from '@/components/dashboard/PerformanceMonitor';
import { NavigationShortcuts } from '@/components/navigation/NavigationShortcuts';
import MobileSearchModal from '@/components/search/MobileSearchModal';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, profile, hydrated } = useAuth();
  const { navigationState, toggleSidebar, toggleSection, isItemActive, getFilteredSections } =
    useNavigation(navigationSections);

  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showExperimentalBanner, setShowExperimentalBanner] = useState(true);

  // Dismiss experimental banner for the current session only
  useEffect(() => {
    try {
      const hidden = sessionStorage.getItem('oc_hide_experimental_banner') === '1';
      if (hidden) {
        setShowExperimentalBanner(false);
      }
    } catch {}
  }, []);

  const dismissExperimentalBanner = () => {
    try {
      sessionStorage.setItem('oc_hide_experimental_banner', '1');
    } catch {}
    setShowExperimentalBanner(false);
  };

  // Wait for hydration before rendering sidebar content
  if (!hydrated) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
      </div>
    );
  }

  const filteredSections = getFilteredSections();

  const handleSidebarNavigate = () => {
    // Close sidebar on mobile when navigating
    if (navigationState.isSidebarOpen) {
      toggleSidebar();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Consistent Header for authenticated routes */}
      <AuthenticatedHeader
        onToggleSidebar={toggleSidebar}
        onShowMobileSearch={() => setShowMobileSearch(true)}
      />

      {/* Mobile overlay */}
      {navigationState.isSidebarOpen && (
        <div
          className={`fixed inset-0 ${SIDEBAR_Z_INDEX.OVERLAY} bg-black bg-opacity-50 ${SIDEBAR_BREAKPOINTS.MOBILE}`}
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Component - Always present when user is logged in */}
      {user && (
        <Sidebar
          user={user}
          profile={profile}
          sections={filteredSections}
          bottomItems={bottomNavItems}
          navigationState={navigationState}
          isItemActive={isItemActive}
          toggleSidebar={toggleSidebar}
          toggleSection={toggleSection}
          onNavigate={handleSidebarNavigate}
        />
      )}

      {/* Experimental Notice (dismissible per session) */}
      {showExperimentalBanner && (
        <div className="bg-gradient-to-r from-orange-100 to-tiffany-100 border-b border-orange-200">
          <div
            className={`px-4 py-2 ${navigationState.isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all ${SIDEBAR_TRANSITIONS.DURATION}`}
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-orange-600 font-medium">🚧 Experimental</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-600">
                  Development preview - features may not work as expected
                </span>
                <span className="text-gray-600">•</span>
                <a
                  href="https://github.com/g-but/orangecat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 font-medium underline"
                >
                  Source
                </a>
              </div>
              <button
                aria-label="Dismiss experimental notice"
                onClick={dismissExperimentalBanner}
                className="ml-4 shrink-0 px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-white/40 rounded-md"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`flex-1 transition-all ${SIDEBAR_TRANSITIONS.DURATION} ${SIDEBAR_TRANSITIONS.EASING} pt-16 ${
          navigationState.isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        <main className="h-full">{children}</main>
      </div>

      {/* Development Tools */}
      <DevPerformanceMonitor />
      <NavigationShortcuts sections={navigationSections} />

      {/* Mobile Search Modal */}
      <MobileSearchModal isOpen={showMobileSearch} onClose={() => setShowMobileSearch(false)} />
    </div>
  );
}
