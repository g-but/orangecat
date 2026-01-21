/**
 * Pending Actions Card
 *
 * Displays pending actions that require user confirmation.
 * Shows in chat when My Cat proposes an action.
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Initial implementation
 */

'use client';

import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Package,
  Briefcase,
  Rocket,
  Heart,
  Calendar,
  MessageSquare,
  Wallet,
  Users,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PendingAction {
  id: string;
  actionId: string;
  category: string;
  parameters: Record<string, unknown>;
  description: string;
  expiresAt: string;
}

interface PendingActionsCardProps {
  action: PendingAction;
  onConfirm: (actionId: string) => Promise<void>;
  onReject: (actionId: string) => Promise<void>;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  entities: Package,
  communication: MessageSquare,
  payments: Wallet,
  organization: Users,
  context: FileText,
  settings: FileText,
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  create_product: Package,
  create_service: Briefcase,
  create_project: Rocket,
  create_cause: Heart,
  create_event: Calendar,
  post_to_timeline: MessageSquare,
  send_message: MessageSquare,
  send_payment: Wallet,
  fund_project: Rocket,
  create_organization: Users,
  add_context: FileText,
};

function formatTimeLeft(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Expired';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
}

export function PendingActionsCard({ action, onConfirm, onReject }: PendingActionsCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [completed, setCompleted] = useState<'confirmed' | 'rejected' | null>(null);

  const Icon = ACTION_ICONS[action.actionId] || CATEGORY_ICONS[action.category] || Package;
  const timeLeft = formatTimeLeft(action.expiresAt);
  const isExpired = timeLeft === 'Expired';

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm(action.id);
      setCompleted('confirmed');
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await onReject(action.id);
      setCompleted('rejected');
    } finally {
      setRejecting(false);
    }
  };

  if (completed) {
    return (
      <div
        className={`rounded-xl border p-4 ${
          completed === 'confirmed' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3">
          {completed === 'confirmed' ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Action confirmed and executed
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Action rejected</span>
            </>
          )}
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-3 text-gray-500">
          <Clock className="h-5 w-5" />
          <span className="text-sm">This action has expired</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-amber-900">Action requires confirmation</h4>
          <p className="text-sm text-amber-700 mt-1">{action.description}</p>
        </div>
      </div>

      {/* Details */}
      <div className="flex items-center gap-4 text-xs text-amber-600">
        <div className="flex items-center gap-1">
          <Icon className="h-3.5 w-3.5" />
          <span className="capitalize">{action.actionId.replace(/_/g, ' ')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>{timeLeft}</span>
        </div>
      </div>

      {/* Parameters preview */}
      {Object.keys(action.parameters).length > 0 && (
        <div className="bg-white/50 rounded-lg p-3 text-xs">
          <div className="font-medium text-amber-800 mb-1">Details:</div>
          <ul className="space-y-0.5 text-amber-700">
            {Object.entries(action.parameters)
              .slice(0, 4)
              .map(([key, value]) => (
                <li key={key}>
                  <span className="opacity-70">{key.replace(/_/g, ' ')}:</span>{' '}
                  <span>
                    {String(value).slice(0, 50)}
                    {String(value).length > 50 ? '...' : ''}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          onClick={handleConfirm}
          disabled={confirming || rejecting}
          size="sm"
          className="flex-1 bg-amber-600 hover:bg-amber-700"
        >
          {confirming ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          Confirm
        </Button>
        <Button
          onClick={handleReject}
          disabled={confirming || rejecting}
          variant="outline"
          size="sm"
          className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          {rejecting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <XCircle className="h-4 w-4 mr-2" />
          )}
          Reject
        </Button>
      </div>
    </div>
  );
}

/**
 * Hook to manage pending actions state
 */
export function usePendingActions() {
  const confirmAction = async (
    actionId: string
  ): Promise<{ success: boolean; data?: unknown; error?: string }> => {
    const res = await fetch(`/api/cat/actions/${actionId}`, {
      method: 'POST',
    });
    return res.json();
  };

  const rejectAction = async (actionId: string, reason?: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/cat/actions/${actionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return res.json();
  };

  const getPendingActions = async (): Promise<PendingAction[]> => {
    const res = await fetch('/api/cat/actions');
    const json = await res.json();
    return json.success ? json.data.pendingActions : [];
  };

  return {
    confirmAction,
    rejectAction,
    getPendingActions,
  };
}

export default PendingActionsCard;
