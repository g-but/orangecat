'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getRouteContext } from '@/config/routes';
import { Header } from './Header';
import { Sidebar } from '@/components/sidebar/Sidebar';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import { useNavigation } from '@/hooks/useNavigation';
import { sidebarSections, bottomNavItems } from '@/config/navigation';
import { MessageSyncManagerInitializer } from '@/components/MessageSyncManagerInitializer';

interface AppShellProps {
  children: ReactNode;
}

/**
 * AppShell Component
 *
 * Unified navigation shell that handles all layout logic:
 * - Header (always visible, context-aware)
 * - Sidebar (authenticated routes only)
 * - Main Content
 * - Footer (public routes only)
 * - MobileBottomNav (context-aware)
 *
 * Created: 2025-12-16
 * Last Modified: 2025-12-17
 * Last Modified Summary: Fixed hydration race condition - wait for auth hydration before rendering sidebar
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, profile, hydrated, isLoading } = useAuth();
  const routeContext = getRouteContext(pathname ?? '/');
  const isAuthenticatedRoute = routeContext === 'authenticated' || routeContext === 'contextual';

  // Wait for auth hydration to prevent sidebar flash
  // During hydration, user is null even if authenticated - this prevents the sidebar from flickering
  const isAuthReady = hydrated && !isLoading;
  const shouldShowSidebar = isAuthenticatedRoute && isAuthReady && user;

  // Get navigation state and functions
  const {
    navigationState,
    toggleSidebar,
    toggleSidebarCollapse,
    toggleSection,
    isItemActive,
    getFilteredSections,
  } = useNavigation(sidebarSections);

  // Get filtered sections based on auth state
  const filteredSections = getFilteredSections();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Initialize message sync manager */}
      <MessageSyncManagerInitializer />

      {/* Header - Always visible */}
      <Header
        showSidebarToggle={!!shouldShowSidebar}
        onToggleSidebar={toggleSidebar}
        showSearch={true}
        variant="default"
      />

      {/* Main Layout Container - pt-14 for mobile header (56px), pt-16 for desktop (64px) */}
      <div className="flex flex-1 pt-14 sm:pt-16">
        {/* Sidebar - Only for authenticated routes when auth is ready */}
        {shouldShowSidebar && (
          <Sidebar
            user={user}
            profile={profile}
            sections={filteredSections}
            bottomItems={bottomNavItems}
            navigationState={navigationState}
            isItemActive={isItemActive}
            toggleSidebar={toggleSidebar}
            toggleSidebarCollapse={toggleSidebarCollapse}
            toggleSection={toggleSection}
          />
        )}

        {/* Main Content Area */}
        <main
          id="main-content"
          className={`flex-1 ${
            shouldShowSidebar
              ? navigationState.isSidebarCollapsed
                ? 'lg:ml-16'
                : 'lg:ml-64'
              : 'ml-0'
          }`}
        >
          {children}
        </main>
      </div>

      {/* Footer - Only for public routes (handled internally by Footer component) */}
      <Footer />

      {/* Mobile Bottom Navigation - Context-aware (handles its own visibility) */}
      <MobileBottomNav />
    </div>
  );
}
