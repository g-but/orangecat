'use client';

import { useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import type { NavSection } from './useNavigation';

const STORAGE_KEYS = {
  SIDEBAR_OPEN: 'orangecat_sidebar_open',
  SIDEBAR_COLLAPSED: 'orangecat_sidebar_collapsed',
  COLLAPSED_SECTIONS: 'orangecat_collapsed_sections',
} as const;

export function buildInitialCollapsedSections(sections: NavSection[]): Set<string> {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const collapsed = new Set<string>();
  sections.forEach(section => {
    if (section.collapsible) {
      if (isMobile ? section.priority > 3 : !section.defaultExpanded) {
        collapsed.add(section.id);
      }
    }
  });
  return collapsed;
}

interface StorageCallbacks {
  onStateLoaded: (state: {
    isSidebarOpen: boolean;
    isSidebarCollapsed: boolean;
    collapsedSections: Set<string>;
  }) => void;
  onLoadFailed: (defaultCollapsed: Set<string>) => void;
}

export function useNavigationStorage(
  hydrated: boolean,
  sections: NavSection[],
  { onStateLoaded, onLoadFailed }: StorageCallbacks
) {
  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      const savedSidebarState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_OPEN);
      const isSidebarOpen = savedSidebarState ? JSON.parse(savedSidebarState) : false;

      const savedCollapsedState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
      const isSidebarCollapsed = savedCollapsedState ? JSON.parse(savedCollapsedState) : false;

      const savedCollapsedSections = localStorage.getItem(STORAGE_KEYS.COLLAPSED_SECTIONS);
      const collapsedFromStorage = savedCollapsedSections
        ? new Set<string>(JSON.parse(savedCollapsedSections))
        : new Set<string>();

      const defaultCollapsed = buildInitialCollapsedSections(sections);
      const collapsedSections =
        collapsedFromStorage.size > 0 ? collapsedFromStorage : defaultCollapsed;

      onStateLoaded({ isSidebarOpen, isSidebarCollapsed, collapsedSections });
    } catch (error) {
      logger.warn('Failed to load navigation state from localStorage', { error }, 'useNavigation');
      onLoadFailed(buildInitialCollapsedSections(sections));
    }
  }, [hydrated, sections, onStateLoaded, onLoadFailed]);

  const persistSidebarState = useCallback((isOpen: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_OPEN, JSON.stringify(isOpen));
    } catch (error) {
      logger.warn('Failed to persist sidebar state', { error, isOpen }, 'useNavigation');
    }
  }, []);

  const persistSidebarCollapsedState = useCallback((isCollapsed: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, JSON.stringify(isCollapsed));
    } catch (error) {
      logger.warn(
        'Failed to persist sidebar collapsed state',
        { error, isCollapsed },
        'useNavigation'
      );
    }
  }, []);

  const persistCollapsedSections = useCallback((collapsed: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEYS.COLLAPSED_SECTIONS, JSON.stringify(Array.from(collapsed)));
    } catch (error) {
      logger.warn('Failed to persist collapsed sections', { error }, 'useNavigation');
    }
  }, []);

  return { persistSidebarState, persistSidebarCollapsedState, persistCollapsedSections };
}

export function clearNavigationStorage() {
  try {
    localStorage.removeItem(STORAGE_KEYS.SIDEBAR_OPEN);
    localStorage.removeItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
    localStorage.removeItem(STORAGE_KEYS.COLLAPSED_SECTIONS);
  } catch {
    // ignore storage errors on reset
  }
}
