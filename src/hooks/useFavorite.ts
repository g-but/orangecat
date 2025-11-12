/**
 * Hook for managing project favorites
 *
 * Handles:
 * - Checking if a project is favorited
 * - Adding/removing favorites
 * - Loading user's favorited projects
 *
 * Created: 2025-01-27
 * Last Modified: 2025-01-27
 * Last Modified Summary: Created favorites hook for project favoriting functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

interface UseFavoriteReturn {
  isFavorited: boolean;
  isLoading: boolean;
  toggleFavorite: () => Promise<void>;
  checkFavoriteStatus: () => Promise<void>;
}

/**
 * Hook to manage favorite status for a single project
 *
 * @param projectId - The project ID to manage favorites for
 * @returns Favorite state and toggle function
 */
export function useFavorite(projectId: string | null): UseFavoriteReturn {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check favorite status when projectId or user changes
  useEffect(() => {
    if (!projectId || !user) {
      setIsFavorited(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/favorite`);
        if (response.ok) {
          const result = await response.json();
          setIsFavorited(result.isFavorited || false);
        }
      } catch (error) {
        logger.error('Failed to check favorite status', { projectId, error }, 'useFavorite');
      }
    };

    checkStatus();
  }, [projectId, user]);

  const toggleFavorite = useCallback(async () => {
    if (!projectId || !user) {
      toast.error('Please sign in to favorite projects');
      return;
    }

    setIsLoading(true);
    try {
      const method = isFavorited ? 'DELETE' : 'POST';
      const response = await fetch(`/api/projects/${projectId}/favorite`, {
        method,
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      const result = await response.json();
      setIsFavorited(result.isFavorited);

      toast.success(result.isFavorited ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      logger.error('Failed to toggle favorite', { projectId, error }, 'useFavorite');
      toast.error('Failed to update favorite. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, user, isFavorited]);

  const checkFavoriteStatus = useCallback(async () => {
    if (!projectId || !user) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/favorite`);
      if (response.ok) {
        const result = await response.json();
        setIsFavorited(result.isFavorited || false);
      }
    } catch (error) {
      logger.error('Failed to check favorite status', { projectId, error }, 'useFavorite');
    }
  }, [projectId, user]);

  return {
    isFavorited,
    isLoading,
    toggleFavorite,
    checkFavoriteStatus,
  };
}
