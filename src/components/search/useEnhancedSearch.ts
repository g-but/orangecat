/**
 * useEnhancedSearch Hook
 *
 * Manages enhanced search state, history, and keyboard navigation.
 * Extracted from EnhancedSearchBar component.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchSuggestions } from '@/hooks/useSearch';
import { useAuth } from '@/hooks/useAuth';

export interface SearchItem {
  text: string;
  action: () => void;
}

export interface QuickAction {
  icon: React.ReactNode;
  label: string;
  action: () => void;
}

export interface UseEnhancedSearchProps {
  showQuickActions?: boolean;
  autoFocus?: boolean;
}

export function useEnhancedSearch({ showQuickActions = true }: UseEnhancedSearchProps = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const { suggestions, loading } = useSearchSuggestions(query, isOpen && query.length > 1);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const quickActions: QuickAction[] = [
    {
      icon: null, // Icons will be set by the component
      label: 'Find People',
      action: () => router.push('/discover?type=profiles'),
    },
    {
      icon: null,
      label: 'Browse Projects',
      action: () => router.push('/discover?type=projects'),
    },
    {
      icon: null,
      label: 'Trending',
      action: () => router.push('/discover?trending=true'),
    },
  ];

  const trendingSearches = [
    'Bitcoin Lightning Network',
    'Open Source Projects',
    'Education Initiatives',
    'Environmental Projects',
  ];

  // Load search history from localStorage
  useEffect(() => {
    if (user) {
      const history = localStorage.getItem(`search-history-${user.id}`);
      if (history) {
        setSearchHistory(JSON.parse(history).slice(0, 5));
      }
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        return;
      }

      // Save to search history
      if (user) {
        const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(
          0,
          5
        );
        setSearchHistory(newHistory);
        localStorage.setItem(`search-history-${user.id}`, JSON.stringify(newHistory));
      }

      // Navigate to search results
      router.push(`/discover?q=${encodeURIComponent(searchQuery)}`);
      setIsOpen(false);
      setQuery('');
      setFocusedIndex(-1);
    },
    [user, searchHistory, router]
  );

  // Calculate all visible items for keyboard navigation
  const getVisibleItems = useCallback((): SearchItem[] => {
    const items: SearchItem[] = [];

    if (query.length === 0) {
      // Quick Actions
      if (showQuickActions) {
        quickActions.forEach(action => {
          items.push({ text: action.label, action: action.action });
        });
      }

      // Search History
      searchHistory.forEach(historyItem => {
        items.push({ text: historyItem, action: () => handleSearch(historyItem) });
      });

      // Trending
      trendingSearches.forEach(trending => {
        items.push({ text: trending, action: () => handleSearch(trending) });
      });
    } else if (query.length > 1) {
      // Suggestions
      suggestions.forEach(suggestion => {
        items.push({ text: suggestion, action: () => handleSearch(suggestion) });
      });

      // Search for exact query
      items.push({ text: `Search for "${query}"`, action: () => handleSearch(query) });
    }

    return items;
  }, [
    query,
    showQuickActions,
    quickActions,
    searchHistory,
    suggestions,
    handleSearch,
    trendingSearches,
  ]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // ⌘K / Ctrl+K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        setFocusedIndex(-1);
        return;
      }

      // Only handle dropdown navigation when search is open
      if (!isOpen) {
        return;
      }

      const visibleItems = getVisibleItems();
      const maxIndex = visibleItems.length - 1;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          inputRef.current?.blur();
          break;

        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => {
            const nextIndex = prev < maxIndex ? prev + 1 : 0;
            setTimeout(() => {
              itemRefs.current[nextIndex]?.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
              });
            }, 0);
            return nextIndex;
          });
          break;

        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => {
            const nextIndex = prev > 0 ? prev - 1 : maxIndex;
            setTimeout(() => {
              itemRefs.current[nextIndex]?.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
              });
            }, 0);
            return nextIndex;
          });
          break;

        case 'Enter':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < visibleItems.length) {
            visibleItems[focusedIndex].action();
          } else {
            handleSearch(query);
          }
          break;

        case 'Tab':
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, query, getVisibleItems, handleSearch]);

  // Reset focused index when dropdown content changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [query, suggestions, searchHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    if (user) {
      localStorage.removeItem(`search-history-${user.id}`);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isOpen && focusedIndex >= 0) {
      e.preventDefault();
    }
    if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
      setFocusedIndex(0);
    }
  };

  return {
    query,
    setQuery,
    isOpen,
    setIsOpen,
    searchHistory,
    focusedIndex,
    suggestions,
    loading,
    searchRef,
    inputRef,
    itemRefs,
    quickActions,
    trendingSearches,
    handleSearch,
    handleSubmit,
    clearHistory,
    handleInputKeyDown,
  };
}
