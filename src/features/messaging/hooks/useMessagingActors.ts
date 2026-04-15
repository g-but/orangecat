/**
 * Hook to fetch actors the user can send messages as
 *
 * @module features/messaging/hooks/useMessagingActors
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { API_ROUTES } from '@/config/api-routes';

export interface MessagingActor {
  actor_id: string;
  actor_type: 'user' | 'group';
  name: string;
  avatar_url: string | null;
  is_personal: boolean;
}

interface UseMessagingActorsResult {
  actors: MessagingActor[];
  isLoading: boolean;
  error: string | null;
  personalActor: MessagingActor | null;
  groupActors: MessagingActor[];
}

export function useMessagingActors(): UseMessagingActorsResult {
  const { user } = useAuth();
  const [actors, setActors] = useState<MessagingActor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setActors([]);
      setIsLoading(false);
      return;
    }

    const fetchActors = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(API_ROUTES.MESSAGES.ACTORS, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch messaging actors');
        }

        const data = await response.json();
        setActors(data.actors || []);
      } catch (err) {
        logger.error('Failed to fetch messaging actors', { error: err }, 'MessagingActors');
        setError(err instanceof Error ? err.message : 'Unknown error');
        setActors([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const personalActor = actors.find(a => a.is_personal) || null;
  const groupActors = actors.filter(a => !a.is_personal);

  return {
    actors,
    isLoading,
    error,
    personalActor,
    groupActors,
  };
}
