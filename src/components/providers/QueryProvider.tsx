'use client';

/**
 * React Query Provider
 *
 * Provides global query caching and data fetching capabilities.
 * Configured with sensible defaults for timeline and data-heavy pages.
 *
 * @module providers/QueryProvider
 */

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create QueryClient instance with useState to ensure client-side only instantiation
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: Data is considered fresh for 30 seconds
            // This prevents unnecessary refetches when navigating between pages
            staleTime: 30 * 1000,

            // Cache time: Keep data in cache for 5 minutes after component unmounts
            // Allows instant display when returning to a page
            gcTime: 5 * 60 * 1000,

            // Don't refetch on window focus by default (can be enabled per-query)
            refetchOnWindowFocus: false,

            // Don't refetch on reconnect by default
            refetchOnReconnect: false,

            // Retry failed requests twice with exponential backoff
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry mutations once
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export default QueryProvider;
