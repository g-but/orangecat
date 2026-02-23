import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/database';
import { apiSuccess, apiInternalError, handleApiError } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';

export const GET = withAuth(async (_req: AuthenticatedRequest) => {
  try {
    const { user } = _req;
    const supabase = await createServerClient();

    // The JS client cannot express the EXISTS/count logic easily; perform a two-step approach:
    // list user conversations, then filter client-side for a single-participant DM.
    let conversationId: string | null = null;
    {
      type ConversationDetail = {
        id: string;
        is_group: boolean;
        participants: Array<{ user_id: string }> | null;
        created_at: string;
      };
      const { data: convs } = await supabase
        .from(DATABASE_TABLES.CONVERSATION_DETAILS)
        .select('*')
        .order('created_at', { ascending: false });
      if (Array.isArray(convs)) {
        const selfConv = (convs as ConversationDetail[]).find(c => {
          if (c.is_group) {
            return false;
          }
          const parts = Array.isArray(c.participants) ? c.participants : [];
          return parts.length === 1 && parts[0]?.user_id === user.id;
        });
        if (selfConv) {
          conversationId = selfConv.id;
        }
      }
    }

    if (!conversationId) {
      // Create new conversation
      // Ensure profile exists to satisfy FK on conversations.created_by
      const { ProfileServerService } = await import('@/services/profile/server');
      const profileResult = await ProfileServerService.ensureProfile(
        supabase,
        user.id,
        user.email || '',
        user.user_metadata || {}
      );

      if (profileResult.error || !profileResult.data) {
        logger.error(
          'Failed to ensure user profile',
          { error: profileResult.error, userId: user.id },
          'Messages'
        );
        return apiInternalError('Failed to create user profile');
      }

      const createWithServer = async () => {
        const conversationInsert: Database['public']['Tables']['conversations']['Insert'] = {
          created_by: user.id,
          is_group: false,
        };
        const { data: convIns, error: convErr } = await (
          supabase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from(DATABASE_TABLES.CONVERSATIONS) as any
        )
          .insert(conversationInsert)
          .select('id')
          .single();
        if (convErr || !convIns) {
          throw convErr || new Error('conv insert failed');
        }
        conversationId = convIns.id as string;
        const participantInsert: Database['public']['Tables']['conversation_participants']['Insert'] =
          {
            conversation_id: conversationId,
            user_id: user.id,
            role: 'member',
          };
        const { error: partErr } = await (
          supabase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS) as any
        ).insert(participantInsert);
        if (partErr) {
          // Roll back conversation if participant insert fails
          // Use admin client for deletion to bypass RLS
          const admin = createAdminClient();
          await admin.from(DATABASE_TABLES.CONVERSATIONS).delete().eq('id', conversationId);
          throw partErr;
        }
      };

      try {
        await createWithServer();
      } catch (serverError) {
        // Dev-only admin fallback when RLS or RPC not ready
        if (process.env.NODE_ENV !== 'production') {
          try {
            const admin = createAdminClient();
            const conversationInsert: Database['public']['Tables']['conversations']['Insert'] = {
              created_by: user.id,
              is_group: false,
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: convIns, error: convErr } = await (admin
              .from(DATABASE_TABLES.CONVERSATIONS)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .insert(conversationInsert as any)
              .select('id')
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .single() as any);
            if (convErr || !convIns || !convIns.id) {
              logger.error(
                'Failed to create conversation (admin)',
                { error: convErr, userId: user.id },
                'Messages'
              );
              return apiInternalError('Failed to create conversation');
            }
            const newConversationId = convIns.id as string;
            conversationId = newConversationId;
            const participantInsert: Database['public']['Tables']['conversation_participants']['Insert'] =
              {
                conversation_id: newConversationId,
                user_id: user.id,
                role: 'member',
              };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: partErr } = await (admin
              .from(DATABASE_TABLES.CONVERSATION_PARTICIPANTS)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .insert(participantInsert as any) as any);
            if (partErr) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (admin
                .from(DATABASE_TABLES.CONVERSATIONS)
                .delete()
                .eq('id', newConversationId) as any);
              logger.error(
                'Failed to add participant (admin)',
                { error: partErr, userId: user.id },
                'Messages'
              );
              return apiInternalError('Failed to add participant');
            }
          } catch (e) {
            logger.error(
              'Self conversation creation failed (admin fallback)',
              { error: e, userId: user.id },
              'Messages'
            );
            return apiInternalError('Self conversation creation failed');
          }
        } else {
          logger.error(
            'Failed to create conversation',
            { error: serverError, userId: user.id },
            'Messages'
          );
          return apiInternalError('Failed to create conversation');
        }
      }
    }

    return apiSuccess({ conversationId });
  } catch (error) {
    logger.error('Self conversation GET error', { error, userId: _req.user.id }, 'Messages');
    return handleApiError(error);
  }
});
