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

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, profile, hydrated } = useAuth();
  const { navigationState, toggleSidebar, toggleSection, isItemActive, getFilteredSections } =
    useNavigation(navigationSections);

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

      {/* Experimental Notice */}
      <ExperimentalBanner
        storageType="session"
        className={`${navigationState.isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all ${SIDEBAR_TRANSITIONS.DURATION}`}
      />

      {/* Main Content */}
      <div
        className={`flex-1 transition-all ${SIDEBAR_TRANSITIONS.DURATION} ${SIDEBAR_TRANSITIONS.EASING} pt-16 pb-20 md:pb-0 ${
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

      {/* Mobile Bottom Navigation - Context-aware for authenticated routes */}
      <MobileBottomNav />
    </div>
  );
}
