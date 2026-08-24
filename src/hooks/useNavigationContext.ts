'use client';

/**
 * Navigation Context Hook
 *
 * Determines and manages the active navigation context:
 * - Individual: User's personal dashboard
 * - Organization: A specific organization dashboard
 *
 * Context is determined by URL pattern and user selection.
 * Persisted to localStorage for session continuity.
 *
 * Created: 2026-02-25
 * Last Modified: 2026-08-20
 * Last Modified Summary: Context type renamed group → organization (EntityType alignment).
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';
import { API_ROUTES } from '@/config/api-routes';

type NavigationContextType = 'individual' | 'organization';

export interface GroupContextInfo {
  id: string;
  slug: string;
  name: string;
  avatar_url?: string;
  role?: string;
}

interface NavigationContext {
  type: NavigationContextType;
  /** Present when type === 'organization' */
  group?: GroupContextInfo;
}

interface UseNavigationContextReturn {
  context: NavigationContext;
  /** Organizations the user belongs to (for the switcher) */
  userGroups: GroupContextInfo[];
  /** Whether memberships are still loading */
  loadingGroups: boolean;
  /** Switch to individual context */
  switchToIndividual: () => void;
  /** Switch to an organization context */
  switchToGroup: (group: GroupContextInfo) => void;
  /** Whether user is in an organization context */
  isGroupContext: boolean;
}

const STORAGE_KEY = 'orangecat_nav_context';

function normalizeStoredContext(parsed: {
  type?: string;
  group?: GroupContextInfo;
}): NavigationContext | null {
  if (parsed.type === 'organization' && parsed.group) {
    return { type: 'organization', group: parsed.group };
  }
  // Legacy persisted shape used type: 'group'
  if (parsed.type === 'group' && parsed.group) {
    return { type: 'organization', group: parsed.group };
  }
  if (parsed.type === 'individual') {
    return { type: 'individual' };
  }
  return null;
}

export function useNavigationContext(): UseNavigationContextReturn {
  const pathname = usePathname();
  const { user } = useAuth();

  const [context, setContext] = useState<NavigationContext>({ type: 'individual' });
  const [userGroups, setUserGroups] = useState<GroupContextInfo[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const orgMatch = pathname.match(/\/(?:organizations|groups)\/([^/]+)/);
    if (orgMatch) {
      const slug = orgMatch[1];
      if (slug === 'join' || slug === 'create') {
        return;
      }
      if (context.type !== 'organization' || context.group?.slug !== slug) {
        const existingGroup = userGroups.find(g => g.slug === slug);
        if (existingGroup) {
          setContext({ type: 'organization', group: existingGroup });
        }
      }
    }
  }, [pathname, userGroups, context.type, context.group?.slug]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const normalized = normalizeStoredContext(
          JSON.parse(saved) as { type?: string; group?: GroupContextInfo }
        );
        if (normalized) {
          setContext(normalized);
        }
      }
    } catch {
      // Ignore corrupt storage
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setUserGroups([]);
      return;
    }

    let cancelled = false;
    setLoadingGroups(true);
    (async () => {
      try {
        const response = await fetch(`${API_ROUTES.GROUPS.BASE}?membership=mine&pageSize=50`);
        if (!response.ok) {
          setUserGroups([]);
          return;
        }
        const data = (await response.json()) as {
          success?: boolean;
          data?: {
            groups?: Array<{ id: string; slug: string; name: string; avatar_url?: string }>;
          };
        };
        if (cancelled) {
          return;
        }
        if (data.success && data.data?.groups) {
          const groups: GroupContextInfo[] = data.data.groups.map(g => ({
            id: g.id,
            slug: g.slug,
            name: g.name,
            avatar_url: g.avatar_url,
          }));
          setUserGroups(groups);
        }
      } catch (error) {
        logger.warn('Failed to load user organizations for context switcher', { error });
        if (!cancelled) {
          setUserGroups([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingGroups(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const switchToIndividual = useCallback(() => {
    const newContext: NavigationContext = { type: 'individual' };
    setContext(newContext);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const switchToGroup = useCallback((group: GroupContextInfo) => {
    const newContext: NavigationContext = { type: 'organization', group };
    setContext(newContext);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newContext));
    } catch {
      // Ignore
    }
  }, []);

  return useMemo(
    () => ({
      context,
      userGroups,
      loadingGroups,
      switchToIndividual,
      switchToGroup,
      isGroupContext: context.type === 'organization',
    }),
    [context, userGroups, loadingGroups, switchToIndividual, switchToGroup]
  );
}
