/**
 * USE CREATE PREFILL HOOK
 *
 * Shared hook for entity creation prefill logic.
 * Handles prefill from URL params (priority) and localStorage (fallback).
 *
 * Created: 2026-01-28
 * Last Modified: 2026-01-28
 * Last Modified Summary: Initial creation - DRY extraction from 3 create pages
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { STORAGE_KEYS } from '@/config/storage-keys';
import type { EntityType } from '@/config/entity-registry';

/**
 * Base fields that can be prefilled from URL params.
 * The generic T can extend any form data type.
 */
interface BasePrefillFields {
  title?: string;
  description?: string;
  category?: string;
}

interface UseCreatePrefillOptions {
  /** Entity type for localStorage key */
  entityType: EntityType;
  /** Whether the hook is ready to run (e.g., user is authenticated) */
  enabled?: boolean;
}

interface UseCreatePrefillReturn<T extends Record<string, unknown>> {
  /** Initial data from prefill sources */
  initialData: Partial<T> | undefined;
  /** Whether prefill has been loaded */
  isLoaded: boolean;
}

/**
 * Hook that handles prefill data for entity creation pages.
 *
 * Priority:
 * 1. URL params (title, description, category)
 * 2. localStorage (entity-specific prefill key)
 *
 * localStorage is automatically cleared after reading.
 *
 * @example
 * const { initialData, isLoaded } = useCreatePrefill<ProjectData>({
 *   entityType: 'project',
 *   enabled: isAuthenticated,
 * });
 */
export function useCreatePrefill<T extends Record<string, unknown>>({
  entityType,
  enabled = true,
}: UseCreatePrefillOptions): UseCreatePrefillReturn<T> {
  const searchParams = useSearchParams();
  const [initialData, setInitialData] = useState<Partial<T> | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Only run when enabled
    if (!enabled) {
      return;
    }

    // Check URL params first (from action buttons, links, etc.)
    const title = searchParams?.get('title');
    const description = searchParams?.get('description');
    const category = searchParams?.get('category');

    if (title || description) {
      const prefillData: BasePrefillFields = {};
      if (title) {
        prefillData.title = title;
      }
      if (description) {
        prefillData.description = description;
      }
      if (category) {
        prefillData.category = category;
      }
      // Cast to Partial<T> - the calling code knows T includes these base fields
      setInitialData(prefillData as Partial<T>);
      setIsLoaded(true);
      return;
    }

    // Fall back to localStorage (legacy support / AI chat prefill)
    try {
      const storageKey = STORAGE_KEYS.ENTITY_PREFILL(entityType);
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw) as Partial<T>;
        setInitialData(data);
        localStorage.removeItem(storageKey);
      }
    } catch {
      // Ignore parse errors
    }

    setIsLoaded(true);
  }, [enabled, searchParams, entityType]);

  return {
    initialData,
    isLoaded,
  };
}
