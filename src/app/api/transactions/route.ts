import { z } from 'zod';
import { compose } from '@/lib/api/compose';
import { withRequestId } from '@/lib/api/withRequestId';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withZodBody } from '@/lib/api/withZod';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiNotFound,
  apiValidationError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { getTableName } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';

const TransactionSchema = z.object({
  projectId: z.string().min(1).max(64),
  amount_sats: z.number().int().positive().max(1_000_000_000_000),
  payment_method: z.enum(['lightning', 'on-chain']),
  message: z.string().max(200).optional().nullable(),
});

type TransactionInput = z.infer<typeof TransactionSchema>;

// POST /api/transactions - Create a new transaction
export const POST = compose(
  withRequestId(),
  withRateLimit('write'),
  withZodBody(TransactionSchema)
)(
  withAuth(async (req: AuthenticatedRequest, ctx) => {
    try {
      const { user, supabase } = req;
      const data = ctx.body as TransactionInput;

      // Verify project exists
      const { data: project, error: projectError } = await supabase
        .from(getTableName('project'))
        .select('id, title, bitcoin_address')
        .eq('id', data.projectId)
        .single();

      if (projectError || !project) {
        logger.warn('Transaction creation: Project not found', {
          projectId: data.projectId,
          userId: user.id,
        });
        return apiNotFound('Project not found');
      }

      // Create pending transaction
      const insertPayload = {
        amount_sats: data.amount_sats,
        currency: 'sats',
        from_entity_type: 'profile',
        from_entity_id: user.id,
        to_entity_type: 'project',
        to_entity_id: project.id,
        payment_method: data.payment_method,
        status: 'pending',
        anonymous: false,
        message: data.message || null,
        public_visibility: true,
      };

      const { data: created, error: txError } = await supabase
        .from(DATABASE_TABLES.TRANSACTIONS)
        .insert([insertPayload])
        .select('id')
        .single();

      if (txError) {
        logger.error('Transaction creation failed', {
          error: txError,
          userId: user.id,
          projectId: data.projectId,
        });
        return handleApiError(txError);
      }

      logger.info('Transaction created successfully', {
        transactionId: created.id,
        userId: user.id,
        projectId: data.projectId,
      });

      return apiSuccess({ success: true, id: created.id, project }, { status: 201 });
    } catch (error) {
      logger.error('Transaction creation error', { error, userId: req.user.id }, 'Transactions');
      return handleApiError(error);
    }
  })
);
