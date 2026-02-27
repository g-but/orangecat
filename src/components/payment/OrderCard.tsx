/**
 * OrderCard — Order summary card for buyer/seller dashboards
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import type { Order } from '@/domain/payments/types';

interface OrderCardProps {
  order: Order;
  /** Whether the current user is the buyer or seller */
  role: 'buyer' | 'seller';
}

const STATUS_CONFIG: Record<string, { label: string; variant: string; icon: React.ElementType }> = {
  pending_payment: { label: 'Awaiting payment', variant: 'secondary', icon: Clock },
  paid: { label: 'Paid', variant: 'default', icon: CheckCircle2 },
  shipped: { label: 'Shipped', variant: 'default', icon: Truck },
  completed: { label: 'Completed', variant: 'default', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
  refunded: { label: 'Refunded', variant: 'secondary', icon: XCircle },
};

export function OrderCard({ order, role }: OrderCardProps) {
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment;
  const StatusIcon = statusConfig.icon;
  const { formatAmount } = useDisplayCurrency();

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Package className="mt-0.5 h-5 w-5 text-gray-400" />
          <div>
            <h4 className="font-medium">{order.entity_title}</h4>
            <p className="text-sm text-gray-500">{formatAmount(order.amount_sats)}</p>
            <p className="text-xs text-gray-400">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Badge variant={statusConfig.variant as 'default' | 'secondary' | 'destructive'}>
          <StatusIcon className="mr-1 h-3 w-3" />
          {statusConfig.label}
        </Badge>
      </div>

      {order.tracking_number && (
        <div className="mt-3 rounded bg-gray-50 p-2 text-sm">
          <span className="text-gray-500">Tracking: </span>
          {order.tracking_url ? (
            <a
              href={order.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-tiffany-600 hover:underline"
            >
              {order.tracking_number}
            </a>
          ) : (
            <span>{order.tracking_number}</span>
          )}
        </div>
      )}

      {role === 'buyer' && order.buyer_note && (
        <p className="mt-2 text-sm text-gray-600">Note: {order.buyer_note}</p>
      )}
      {role === 'seller' && order.seller_note && (
        <p className="mt-2 text-sm text-gray-600">Note: {order.seller_note}</p>
      )}
    </Card>
  );
}
