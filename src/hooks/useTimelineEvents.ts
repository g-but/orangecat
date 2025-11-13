/**
 * Timeline Events Hook - Automatically create timeline events for user actions
 *
 * This hook listens for various user actions and automatically creates timeline events
 * to populate the activity feed with real data.
 */

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';

export const useTimelineEvents = () => {
  const { user, profile } = useAuth();

  // Listen for project creation events
  useEffect(() => {
    if (!user?.id) {
      return;
    }

    // Listen for custom events dispatched when projects are created
    const handleProjectCreated = async (event: CustomEvent) => {
      const { projectId, projectData } = event.detail;

      try {
        await timelineService.createProjectEvent(projectId, 'project_created', user.id, {
          metadata: {
            project_title: projectData.title,
            project_description: projectData.description,
            project_category: projectData.category,
            project_goal: projectData.goal_amount,
            project_currency: projectData.currency,
          },
        });

        logger.info('Created timeline event for project creation', { projectId }, 'TimelineHook');
      } catch (error) {
        logger.error('Failed to create project creation timeline event', error, 'TimelineHook');
      }
    };

    // Listen for donation events
    const handleDonationReceived = async (event: CustomEvent) => {
      const { transactionId, projectId, amountSats, amountBtc, donorId } = event.detail;

      try {
        await timelineService.createTransactionEvent(
          transactionId,
          projectId,
          donorId || user.id,
          amountSats,
          amountBtc
        );

        logger.info(
          'Created timeline event for donation',
          { transactionId, projectId },
          'TimelineHook'
        );
      } catch (error) {
        logger.error('Failed to create donation timeline event', error, 'TimelineHook');
      }
    };

    // Listen for profile updates
    const handleProfileUpdated = async (event: CustomEvent) => {
      const { changes } = event.detail;

      try {
        // Only create events for significant profile changes
        const significantFields = [
          'display_name',
          'username',
          'bio',
          'bitcoin_address',
          'lightning_address',
          'avatar_url',
        ];

        const hasSignificantChange = significantFields.some(
          field => changes && changes[field] !== undefined
        );

        if (hasSignificantChange) {
          await timelineService.createEvent({
            eventType: 'profile_updated',
            actorId: user.id,
            subjectType: 'profile',
            subjectId: user.id,
            title: 'Updated profile information',
            description: `${profile?.display_name || profile?.username || 'User'} updated their profile`,
            visibility: 'followers',
            metadata: { changes },
          });

          logger.info(
            'Created timeline event for profile update',
            { userId: user.id },
            'TimelineHook'
          );
        }
      } catch (error) {
        logger.error('Failed to create profile update timeline event', error, 'TimelineHook');
      }
    };

    // Listen for follows
    const handleUserFollowed = async (event: CustomEvent) => {
      const { followedUserId, followedUserData } = event.detail;

      try {
        await timelineService.createEvent({
          eventType: 'user_followed',
          actorId: user.id,
          subjectType: 'profile',
          subjectId: followedUserId,
          targetType: 'profile',
          targetId: followedUserId,
          title: `Started following ${followedUserData?.display_name || followedUserData?.username || 'someone'}`,
          description: `${profile?.display_name || profile?.username || 'User'} started following ${followedUserData?.display_name || followedUserData?.username || 'someone'}`,
          visibility: 'followers',
        });

        logger.info('Created timeline event for user follow', { followedUserId }, 'TimelineHook');
      } catch (error) {
        logger.error('Failed to create follow timeline event', error, 'TimelineHook');
      }
    };

    // Add event listeners
    window.addEventListener('project-created' as any, handleProjectCreated);
    window.addEventListener('donation-received' as any, handleDonationReceived);
    window.addEventListener('profile-updated' as any, handleProfileUpdated);
    window.addEventListener('user-followed' as any, handleUserFollowed);

    // Cleanup
    return () => {
      window.removeEventListener('project-created' as any, handleProjectCreated);
      window.removeEventListener('donation-received' as any, handleDonationReceived);
      window.removeEventListener('profile-updated' as any, handleProfileUpdated);
      window.removeEventListener('user-followed' as any, handleUserFollowed);
    };
  }, [user?.id, profile]);

  // Helper functions to dispatch events from other parts of the app
  return {
    dispatchProjectCreated: (projectId: string, projectData: any) => {
      window.dispatchEvent(
        new CustomEvent('project-created', {
          detail: { projectId, projectData },
        })
      );
    },

    dispatchDonationReceived: (
      transactionId: string,
      projectId: string,
      amountSats: number,
      amountBtc: number,
      donorId?: string
    ) => {
      window.dispatchEvent(
        new CustomEvent('donation-received', {
          detail: { transactionId, projectId, amountSats, amountBtc, donorId },
        })
      );
    },

    dispatchProfileUpdated: (changes: Record<string, any>) => {
      window.dispatchEvent(
        new CustomEvent('profile-updated', {
          detail: { changes },
        })
      );
    },

    dispatchUserFollowed: (followedUserId: string, followedUserData?: any) => {
      window.dispatchEvent(
        new CustomEvent('user-followed', {
          detail: { followedUserId, followedUserData },
        })
      );
    },
  };
};
