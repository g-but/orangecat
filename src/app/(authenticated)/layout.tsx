'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/hooks/useNavigation';
import { navigationSections, bottomNavItems } from '@/config/navigationConfig';
import { SIDEBAR_Z_INDEX, SIDEBAR_TRANSITIONS, SIDEBAR_BREAKPOINTS } from '@/constants/sidebar';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { AuthenticatedHeader } from '@/components/layout/AuthenticatedHeader';
import { DevPerformanceMonitor } from '@/components/dashboard/PerformanceMonitor';
import { NavigationShortcuts } from '@/components/navigation/NavigationShortcuts';
import MobileSearchModal from '@/components/search/MobileSearchModal';
import ExperimentalBanner from '@/components/ui/ExperimentalBanner';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { ComposerProvider, useComposer } from '@/contexts/ComposerContext';
import PostComposerMobile from '@/components/timeline/PostComposerMobile';
import { useRouter } from 'next/navigation';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

function AuthenticatedLayoutContent({ children }: AuthenticatedLayoutProps) {
  const { user, profile, hydrated } = useAuth();
  const { navigationState, toggleSidebar, toggleSection, isItemActive, getFilteredSections } =
    useNavigation(navigationSections);
  const { isOpen: isComposerOpen, closeComposer } = useComposer();
  const router = useRouter();

  const [showMobileSearch, setShowMobileSearch] = useState(false);

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
          className={`fixed inset-0 ${SIDEBAR_Z_INDEX.OVERLAY} bg-black bg-opacity-50 ${SIDEBAR_BREAKPOINTS.MOBILE} transition-opacity ${SIDEBAR_TRANSITIONS.DURATION}`}
          onClick={toggleSidebar}
          style={{
            top: 'calc(4rem + env(safe-area-inset-top, 0px))',
          }}
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

      {/* Experimental Notice */}
      <ExperimentalBanner
        storageType="session"
        className={`pt-16 ${navigationState.isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'} transition-all ${SIDEBAR_TRANSITIONS.DURATION}`}
        style={{
          paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px))',
        }}
      />

      {/* Main Content */}
      <div
        className={`flex-1 transition-all ${SIDEBAR_TRANSITIONS.DURATION} ${SIDEBAR_TRANSITIONS.EASING} pt-16 px-2 sm:px-4 md:px-6 lg:px-8 ${
          navigationState.isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        }`}
        style={{
          paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px))',
          paddingBottom: 'clamp(5rem, calc(env(safe-area-inset-bottom, 0px) + 5rem), 6rem)',
        }}
      >
        <main className="h-full max-w-7xl mx-auto">{children}</main>
      </div>

      {/* Development Tools */}
      <DevPerformanceMonitor />
      <NavigationShortcuts sections={navigationSections} />

      {/* Mobile Search Modal */}
      <MobileSearchModal isOpen={showMobileSearch} onClose={() => setShowMobileSearch(false)} />

      {/* Mobile Bottom Navigation - Context-aware for authenticated routes */}
      <MobileBottomNav />

      {/* Global Mobile Composer - Opens instantly from Plus button */}
      {user && (
        <PostComposerMobile
          fullScreen={true}
          isOpen={isComposerOpen}
          onClose={() => {
            closeComposer();
            // If we navigated to timeline, go back
            if (window.location.pathname === '/timeline' && window.location.search.includes('compose=true')) {
              router.replace('/timeline', { scroll: false });
            }
          }}
          onPostCreated={() => {
            closeComposer();
            // Refresh current page if on timeline
            if (window.location.pathname === '/timeline') {
              window.location.reload();
            }
          }}
          autoFocus={true}
          showProjectSelection={true}
          placeholder="What's happening?"
          buttonText="Post"
        />
      )}
    </div>
  );
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <ComposerProvider>
      <AuthenticatedLayoutContent>{children}</AuthenticatedLayoutContent>
    </ComposerProvider>
  );
}
