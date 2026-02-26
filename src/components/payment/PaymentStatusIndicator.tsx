/**
 * PaymentStatusIndicator — Animated status badge during polling
 */

'use client';

import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import type { PaymentIntentStatus } from '@/domain/payments/types';

interface PaymentStatusIndicatorProps {
  status: PaymentIntentStatus | 'initiating';
}

const STATUS_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; color: string; animate?: boolean }
> = {
  initiating: {
    icon: Loader2,
    label: 'Creating invoice...',
    color: 'text-gray-500',
    animate: true,
  },
  created: {
    icon: Loader2,
    label: 'Generating invoice...',
    color: 'text-gray-500',
    animate: true,
  },
  invoice_ready: {
    icon: Clock,
    label: 'Waiting for payment...',
    color: 'text-yellow-600',
    animate: true,
  },
  paid: {
    icon: CheckCircle2,
    label: 'Payment confirmed!',
    color: 'text-green-600',
  },
  buyer_confirmed: {
    icon: CheckCircle2,
    label: 'Payment sent!',
    color: 'text-green-600',
  },
  expired: {
    icon: XCircle,
    label: 'Invoice expired',
    color: 'text-red-500',
  },
  failed: {
    icon: AlertCircle,
    label: 'Payment failed',
    color: 'text-red-500',
  },
};

export function PaymentStatusIndicator({ status }: PaymentStatusIndicatorProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.created;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${config.color}`}>
      <Icon className={`h-5 w-5 ${config.animate ? 'animate-spin' : ''}`} />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
}
