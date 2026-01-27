/**
 * USE PENDING ACTIONS MANAGER HOOK
 * Manages pending action fetching and confirmation
 */

import { useCallback, useEffect, useState } from 'react';
import { usePendingActions } from '../../PendingActionsCard';
import { logger } from '@/utils/logger';
import type { PendingAction } from '../types';

interface UsePendingActionsManagerOptions {
  onActionConfirmed?: (action: PendingAction) => void;
}

export function usePendingActionsManager({
  onActionConfirmed,
}: UsePendingActionsManagerOptions = {}) {
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const { confirmAction, rejectAction, getPendingActions } = usePendingActions();

  // Fetch pending actions on mount and periodically
  useEffect(() => {
    const fetchPendingActions = async () => {
      try {
        const actions = await getPendingActions();
        setPendingActions(actions);
      } catch (e) {
        logger.error('Failed to fetch pending actions', { error: e }, 'usePendingActionsManager');
      }
    };

    void fetchPendingActions();
    // Poll for new pending actions every 30 seconds
    const interval = setInterval(fetchPendingActions, 30000);
    return () => clearInterval(interval);
  }, [getPendingActions]);

  const handleConfirmAction = useCallback(
    async (actionId: string) => {
      try {
        const result = await confirmAction(actionId);
        if (result.success) {
          const action = pendingActions.find(a => a.id === actionId);
          // Remove from local state
          setPendingActions(prev => prev.filter(a => a.id !== actionId));
          // Notify parent
          if (action && onActionConfirmed) {
            onActionConfirmed(action);
          }
        }
      } catch (e) {
        logger.error(
          'Failed to confirm action',
          { error: e, actionId },
          'usePendingActionsManager'
        );
      }
    },
    [confirmAction, pendingActions, onActionConfirmed]
  );

  const handleRejectAction = useCallback(
    async (actionId: string) => {
      try {
        await rejectAction(actionId);
        // Remove from local state
        setPendingActions(prev => prev.filter(a => a.id !== actionId));
      } catch (e) {
        logger.error('Failed to reject action', { error: e, actionId }, 'usePendingActionsManager');
      }
    },
    [rejectAction]
  );

  return {
    pendingActions,
    handleConfirmAction,
    handleRejectAction,
  };
}
