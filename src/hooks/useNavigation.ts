'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from './useAuth'

// Navigation types
export interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  comingSoon?: boolean
  badge?: string
  description?: string
  requiresAuth?: boolean
  requiresProfile?: boolean
}

export interface NavSection {
  id: string
  title: string
  items: NavItem[]
  collapsible?: boolean
  defaultExpanded?: boolean
  priority: number
  requiresAuth?: boolean
}

// Navigation state interface
export interface NavigationState {
  isSidebarOpen: boolean
  collapsedSections: Set<string>
  activeSection: string | null
  activeItem: string | null
}

// Hook return type
export interface UseNavigationReturn {
  navigationState: NavigationState
  toggleSidebar: () => void
  toggleSection: (sectionId: string) => void
  setSidebarOpen: (open: boolean) => void
  isItemActive: (href: string) => boolean
  getFilteredSections: () => NavSection[]
  resetNavigation: () => void
}

// Local storage keys
const STORAGE_KEYS = {
  SIDEBAR_OPEN: 'orangecat_sidebar_open',
  COLLAPSED_SECTIONS: 'orangecat_collapsed_sections',
} as const

export function useNavigation(sections: NavSection[]): UseNavigationReturn {
  const pathname = usePathname()
  const { user, profile, hydrated } = useAuth()

  // Initialize state
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isSidebarOpen: true,
    collapsedSections: new Set<string>(),
    activeSection: null,
    activeItem: null,
  })

  // Initialize navigation state from localStorage and defaults
  useEffect(() => {
    if (!hydrated) return

    try {
      // Load sidebar state from localStorage
      const savedSidebarState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_OPEN)
      const isSidebarOpen = savedSidebarState ? JSON.parse(savedSidebarState) : true

      // Load collapsed sections from localStorage
      const savedCollapsedSections = localStorage.getItem(STORAGE_KEYS.COLLAPSED_SECTIONS)
      const collapsedFromStorage = savedCollapsedSections 
        ? new Set<string>(JSON.parse(savedCollapsedSections))
        : new Set<string>()

      // Initialize collapsed sections based on defaults and saved state
      const initialCollapsed = new Set<string>()
      sections.forEach(section => {
        if (section.collapsible) {
          if (collapsedFromStorage.has(section.id)) {
            initialCollapsed.add(section.id)
          } else if (!section.defaultExpanded && !collapsedFromStorage.size) {
            // Only use defaults if no saved state exists
            initialCollapsed.add(section.id)
          }
        }
      })

      setNavigationState(prev => ({
        ...prev,
        isSidebarOpen,
        collapsedSections: initialCollapsed,
      }))
    } catch (error) {
      console.warn('Failed to load navigation state from localStorage:', error)
      // Fall back to defaults
      const defaultCollapsed = new Set<string>()
      sections.forEach(section => {
        if (section.collapsible && !section.defaultExpanded) {
          defaultCollapsed.add(section.id)
        }
      })
      setNavigationState(prev => ({
        ...prev,
        collapsedSections: defaultCollapsed,
      }))
    }
  }, [hydrated, sections])

  // Update active section and item based on pathname
  useEffect(() => {
    if (!pathname) return

    let activeSection: string | null = null
    let activeItem: string | null = null

    for (const section of sections) {
      for (const item of section.items) {
        if (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) {
          activeSection = section.id
          activeItem = item.href
          break
        }
      }
      if (activeSection) break
    }

    setNavigationState(prev => ({
      ...prev,
      activeSection,
      activeItem,
    }))
  }, [pathname, sections])

  // Persist sidebar state to localStorage
  const persistSidebarState = useCallback((isOpen: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_OPEN, JSON.stringify(isOpen))
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error)
    }
  }, [])

  // Persist collapsed sections to localStorage
  const persistCollapsedSections = useCallback((collapsed: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEYS.COLLAPSED_SECTIONS, JSON.stringify(Array.from(collapsed)))
    } catch (error) {
      console.warn('Failed to save collapsed sections to localStorage:', error)
    }
  }, [])

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setNavigationState(prev => {
      const newIsOpen = !prev.isSidebarOpen
      persistSidebarState(newIsOpen)
      return {
        ...prev,
        isSidebarOpen: newIsOpen,
      }
    })
  }, [persistSidebarState])

  // Set sidebar open state
  const setSidebarOpen = useCallback((open: boolean) => {
    setNavigationState(prev => {
      if (prev.isSidebarOpen === open) return prev
      persistSidebarState(open)
      return {
        ...prev,
        isSidebarOpen: open,
      }
    })
  }, [persistSidebarState])

  // Toggle section collapse
  const toggleSection = useCallback((sectionId: string) => {
    setNavigationState(prev => {
      const newCollapsed = new Set(prev.collapsedSections)
      if (newCollapsed.has(sectionId)) {
        newCollapsed.delete(sectionId)
      } else {
        newCollapsed.add(sectionId)
      }
      persistCollapsedSections(newCollapsed)
      return {
        ...prev,
        collapsedSections: newCollapsed,
      }
    })
  }, [persistCollapsedSections])

  // Check if item is active
  const isItemActive = useCallback((href: string) => {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }, [pathname])

  // Filter sections based on auth state and requirements
  const getFilteredSections = useCallback(() => {
    if (!hydrated) return []

    return sections.filter(section => {
      // Check section-level auth requirements
      if (section.requiresAuth && !user) return false

      // Filter items within the section
      const filteredItems = section.items.filter(item => {
        if (item.requiresAuth && !user) return false
        if (item.requiresProfile && !profile) return false
        return true
      })

      // Only include section if it has visible items
      return filteredItems.length > 0
    }).map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (item.requiresAuth && !user) return false
        if (item.requiresProfile && !profile) return false
        return true
      })
    })).sort((a, b) => a.priority - b.priority)
  }, [sections, user, profile, hydrated])

  // Reset navigation state
  const resetNavigation = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.SIDEBAR_OPEN)
      localStorage.removeItem(STORAGE_KEYS.COLLAPSED_SECTIONS)
    } catch (error) {
      console.warn('Failed to clear navigation state from localStorage:', error)
    }

    const defaultCollapsed = new Set<string>()
    sections.forEach(section => {
      if (section.collapsible && !section.defaultExpanded) {
        defaultCollapsed.add(section.id)
      }
    })

    setNavigationState({
      isSidebarOpen: true,
      collapsedSections: defaultCollapsed,
      activeSection: null,
      activeItem: null,
    })
  }, [sections])

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    navigationState,
    toggleSidebar,
    toggleSection,
    setSidebarOpen,
    isItemActive,
    getFilteredSections,
    resetNavigation,
  }), [
    navigationState,
    toggleSidebar,
    toggleSection,
    setSidebarOpen,
    isItemActive,
    getFilteredSections,
    resetNavigation,
  ])
} 