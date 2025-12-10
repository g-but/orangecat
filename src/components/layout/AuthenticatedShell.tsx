"use client";

import { useState, Suspense, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/hooks/useNavigation';
import { navigationSections, bottomNavItems } from '@/config/navigationConfig';
import { AuthenticatedHeader } from '@/components/layout/AuthenticatedHeader';
import { Sidebar } from '@/components/sidebar/Sidebar';
import Loading from '@/components/Loading';

interface AuthenticatedShellProps {
  children: React.ReactNode;
}

export default function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  const { user, profile } = useAuth();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Only compute sections once; filtering is handled by the hook
  const sections = useMemo(() => navigationSections, []);
  const {
    navigationState,
    toggleSidebar,
    toggleSection,
    setSidebarOpen,
    isItemActive,
    getFilteredSections,
  } = useNavigation(sections);

  const filteredSections = getFilteredSections();

  return (
    <div className="min-h-screen bg-white">
      {/* Authenticated Header */}
      <AuthenticatedHeader
        onToggleSidebar={toggleSidebar}
        onShowMobileSearch={() => setShowMobileSearch(true)}
      />

      {/* Sidebar (fixed) */}
      <Sidebar
        user={user}
        profile={profile || null}
        sections={filteredSections}
        bottomItems={bottomNavItems}
        navigationState={navigationState}
        isItemActive={isItemActive}
        toggleSidebar={toggleSidebar}
        toggleSection={toggleSection}
        onNavigate={() => setSidebarOpen(false)}
      />

      {/* Main content area with spacing for header (16) and collapsed sidebar (16 on lg+) */}
      <main className="pt-16 lg:pl-16">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </div>
      </main>

      {/* Simple mobile search placeholder (non-blocking) */}
      {showMobileSearch && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] bg-black/40 flex items-start justify-center p-4"
          onClick={() => setShowMobileSearch(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-sm text-gray-600">Search coming soon</div>
            <button
              onClick={() => setShowMobileSearch(false)}
              className="mt-3 inline-flex px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

