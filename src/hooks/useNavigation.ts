'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useActiveNavItem } from './useActiveNavItem';
import {
  useNavigationStorage,
  buildInitialCollapsedSections,
  clearNavigationStorage,
} from './useNavigationStorage';

export interface NavItem {
  name: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  comingSoon?: boolean;
  badge?: string;
  description?: string;
  requiresAuth?: boolean;
  requiresProfile?: boolean;
  children?: NavItem[];
  external?: boolean;
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  priority: number;
  requiresAuth?: boolean;
}

export interface NavigationState {
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  collapsedSections: Set<string>;
  activeSection: string | null;
  activeItem: string | null;
}

export interface UseNavigationReturn {
  navigationState: NavigationState;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  toggleSection: (sectionId: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isItemActive: (href: string) => boolean;
  getFilteredSections: () => NavSection[];
  resetNavigation: () => void;
}

export function useNavigation(sections: NavSection[]): UseNavigationReturn {
  const { user, profile, hydrated } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const { persistSidebarState, persistSidebarCollapsedState, persistCollapsedSections } =
    useNavigationStorage(hydrated, sections, {
      onStateLoaded: ({ isSidebarOpen, isSidebarCollapsed, collapsedSections }) => {
        setIsSidebarOpen(isSidebarOpen);
        setIsSidebarCollapsed(isSidebarCollapsed);
        setCollapsedSections(collapsedSections);
      },
      onLoadFailed: defaultCollapsed => {
        setCollapsedSections(defaultCollapsed);
      },
    });

  const { activeSection, activeItem, isItemActive } = useActiveNavItem(sections);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      persistSidebarState(next);
      return next;
    });
  }, [persistSidebarState]);

  const setSidebarOpen = useCallback(
    (open: boolean) => {
      setIsSidebarOpen(prev => {
        if (prev === open) {
          return prev;
        }
        persistSidebarState(open);
        return open;
      });
    },
    [persistSidebarState]
  );

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      persistSidebarCollapsedState(next);
      return next;
    });
  }, [persistSidebarCollapsedState]);

  const setSidebarCollapsed = useCallback(
    (collapsed: boolean) => {
      setIsSidebarCollapsed(prev => {
        if (prev === collapsed) {
          return prev;
        }
        persistSidebarCollapsedState(collapsed);
        return collapsed;
      });
    },
    [persistSidebarCollapsedState]
  );

  const toggleSection = useCallback(
    (sectionId: string) => {
      setCollapsedSections(prev => {
        const next = new Set(prev);
        if (next.has(sectionId)) {
          next.delete(sectionId);
        } else {
          next.add(sectionId);
        }
        persistCollapsedSections(next);
        return next;
      });
    },
    [persistCollapsedSections]
  );

  const getFilteredSections = useCallback(() => {
    if (!hydrated) {
      return [];
    }

    return sections
      .filter(section => {
        if (section.requiresAuth && !user) {
          return false;
        }
        const filteredItems = section.items.filter(item => {
          if (item.requiresAuth && !user) {
            return false;
          }
          if (item.requiresProfile && !profile) {
            return false;
          }
          return true;
        });
        return filteredItems.length > 0;
      })
      .map(section => ({
        ...section,
        items: section.items.filter(item => {
          if (item.requiresAuth && !user) {
            return false;
          }
          if (item.requiresProfile && !profile) {
            return false;
          }
          return true;
        }),
      }))
      .sort((a, b) => a.priority - b.priority);
  }, [sections, user, profile, hydrated]);

  const resetNavigation = useCallback(() => {
    clearNavigationStorage();
    setIsSidebarOpen(false);
    setIsSidebarCollapsed(false);
    setCollapsedSections(buildInitialCollapsedSections(sections));
  }, [sections]);

  const navigationState = useMemo<NavigationState>(
    () => ({ isSidebarOpen, isSidebarCollapsed, collapsedSections, activeSection, activeItem }),
    [isSidebarOpen, isSidebarCollapsed, collapsedSections, activeSection, activeItem]
  );

  return useMemo(
    () => ({
      navigationState,
      toggleSidebar,
      toggleSidebarCollapse,
      toggleSection,
      setSidebarOpen,
      setSidebarCollapsed,
      isItemActive,
      getFilteredSections,
      resetNavigation,
    }),
    [
      navigationState,
      toggleSidebar,
      toggleSidebarCollapse,
      toggleSection,
      setSidebarOpen,
      setSidebarCollapsed,
      isItemActive,
      getFilteredSections,
      resetNavigation,
    ]
  );
}
