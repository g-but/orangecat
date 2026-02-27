/**
 * usePaymentFlow — Manages the full payment lifecycle
 *
 * 1. Initiate payment (POST /api/payments)
 * 2. Poll for status (GET /api/payments/[id])
 * 3. Handle success/expiry
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  InitiatePaymentResult,
  PaymentIntentStatus,
  PaymentMethod,
} from '@/domain/payments/types';
import type { EntityType } from '@/config/entity-registry';

// Poll intervals by payment method
const POLL_INTERVALS: Record<PaymentMethod, number> = {
  nwc: 3_000, // 3 seconds — NWC can detect quickly
  lightning_address: 5_000, // 5 seconds
  onchain: 30_000, // 30 seconds — blocks take time
};

type PaymentFlowState =
  | { phase: 'idle' }
  | { phase: 'initiating' }
  | { phase: 'awaiting_payment'; data: InitiatePaymentResult }
  | { phase: 'success'; data: InitiatePaymentResult }
  | { phase: 'expired' }
  | { phase: 'error'; message: string };

export function usePaymentFlow() {
  const [state, setState] = useState<PaymentFlowState>({ phase: 'idle' });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (paymentIntentId: string, method: PaymentMethod, data: InitiatePaymentResult) => {
      stopPolling();

      const interval = POLL_INTERVALS[method];

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments/${paymentIntentId}`);
          if (!res.ok) {
            return;
          }

          const json = await res.json();
          const status = json.data?.status as PaymentIntentStatus;

          if (status === 'paid') {
            stopPolling();
            setState({ phase: 'success', data });
          } else if (status === 'expired') {
            stopPolling();
            setState({ phase: 'expired' });
          } else if (status === 'buyer_confirmed') {
            stopPolling();
            setState({ phase: 'success', data });
          }
        } catch {
          // Silently ignore poll errors — will retry on next interval
        }
      }, interval);
    },
    [stopPolling]
  );

  const initiate = useCallback(
    async (params: {
      entity_type: EntityType;
      entity_id: string;
      amount_sats?: number;
      message?: string;
      is_anonymous?: boolean;
      shipping_address_id?: string;
      buyer_note?: string;
    }) => {
      setState({ phase: 'initiating' });

      try {
        const res = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          setState({
            phase: 'error',
            message: json.error?.message || 'Failed to initiate payment',
          });
          return;
        }

        const data = json.data as InitiatePaymentResult;
        setState({ phase: 'awaiting_payment', data });

        // Start polling for payment confirmation
        const method = data.payment_intent.payment_method as PaymentMethod;
        startPolling(data.payment_intent.id, method, data);
      } catch (error) {
        setState({
          phase: 'error',
          message: error instanceof Error ? error.message : 'Network error',
        });
      }
    },
    [startPolling]
  );

  const confirmPaid = useCallback(async () => {
    if (state.phase !== 'awaiting_payment') {
      return;
    }

    const piId = state.data.payment_intent.id;

    try {
      const res = await fetch(`/api/payments/${piId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'buyer_confirm' }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        stopPolling();
        setState({ phase: 'success', data: state.data });
      } else {
        setState({
          phase: 'error',
          message: json.error?.message || 'Failed to confirm payment. Please try again.',
        });
      }
    } catch {
      setState({
        phase: 'error',
        message: 'Network error confirming payment. Please try again.',
      });
    }
  }, [state, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setState({ phase: 'idle' });
  }, [stopPolling]);

  return {
    state,
    initiate,
    confirmPaid,
    reset,
    isLoading: state.phase === 'initiating',
    isAwaitingPayment: state.phase === 'awaiting_payment',
    isSuccess: state.phase === 'success',
    isError: state.phase === 'error',
  };
}
