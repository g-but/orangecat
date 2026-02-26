/**
 * POST /api/payments — Initiate a payment
 *
 * Creates a payment intent, generates an invoice (NWC/LN Address/On-chain),
 * and creates an order or contribution record.
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, apiBadRequest, apiInternalError } from '@/lib/api/standardResponse';
import { initiatePayment } from '@/domain/payments';
import { isValidEntityType } from '@/config/entity-registry';
import { logger } from '@/utils/logger';

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;
    const body = await request.json();

    // Validate required fields
    if (!body.entity_type || !body.entity_id) {
      return apiBadRequest('entity_type and entity_id are required');
    }

    if (!isValidEntityType(body.entity_type)) {
      return apiBadRequest(`Invalid entity type: ${body.entity_type}`);
    }

    const result = await initiatePayment(supabase, user.id, {
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      amount_sats: body.amount_sats,
      message: body.message,
      is_anonymous: body.is_anonymous,
      shipping_address_id: body.shipping_address_id,
      buyer_note: body.buyer_note,
    });

    return apiSuccess(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment initiation failed';
    logger.error('Payment initiation failed', { error });

    // Return user-friendly errors for known cases
    if (
      message.includes('no wallet') ||
      message.includes('own entity') ||
      message.includes('no price') ||
      message.includes('Amount is required')
    ) {
      return apiBadRequest(message);
    }

    return apiInternalError('Failed to initiate payment');
  }
});
