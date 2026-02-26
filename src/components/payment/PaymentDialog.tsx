/**
 * PaymentDialog — Full payment flow modal
 *
 * Phases: Confirm → QR code → Waiting → Success
 * Handles both fixed_price (buy) and contribution (support) flows.
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { PaymentQRCode } from './PaymentQRCode';
import { PaymentStatusIndicator } from './PaymentStatusIndicator';
import { ContributionAmountInput } from './ContributionAmountInput';
import { usePaymentFlow } from '@/hooks/usePaymentFlow';
import { getEntityMetadata, type EntityType } from '@/config/entity-registry';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  entityId: string;
  /** Entity title for display */
  entityTitle: string;
  /** Price in sats (for fixed_price entities) */
  priceSats?: number;
  /** Seller's profile ID (for checking wallet availability) */
  sellerProfileId?: string;
}

export function PaymentDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityTitle,
  priceSats,
}: PaymentDialogProps) {
  const meta = getEntityMetadata(entityType);
  const isContribution = meta.paymentPattern === 'contribution';

  const { state, initiate, confirmPaid, reset, isLoading } = usePaymentFlow();

  // Contribution-specific state
  const [contributionAmount, setContributionAmount] = useState(5_000);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleClose = () => {
    reset();
    setMessage('');
    setContributionAmount(5_000);
    onOpenChange(false);
  };

  const handleInitiate = () => {
    initiate({
      entity_type: entityType,
      entity_id: entityId,
      amount_sats: isContribution ? contributionAmount : undefined,
      message: isContribution ? message || undefined : undefined,
      is_anonymous: isContribution ? isAnonymous : undefined,
    });
  };

  const amountSats = isContribution ? contributionAmount : (priceSats ?? 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isContribution ? 'Support' : 'Buy'} {entityTitle}
          </DialogTitle>
          <DialogDescription>
            {isContribution
              ? 'Choose an amount to support this project'
              : `Pay ${amountSats.toLocaleString()} sats`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Phase: Idle / Confirm */}
          {state.phase === 'idle' && (
            <>
              {isContribution && (
                <div className="space-y-4">
                  <ContributionAmountInput
                    value={contributionAmount}
                    onChange={setContributionAmount}
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-700">Message (optional)</label>
                    <Textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Leave a message of support..."
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={e => setIsAnonymous(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Contribute anonymously
                  </label>
                </div>
              )}

              <Button
                onClick={handleInitiate}
                disabled={isLoading || amountSats <= 0}
                className="w-full min-h-11"
              >
                {isContribution
                  ? `Support with ${amountSats.toLocaleString()} sats`
                  : `Pay ${amountSats.toLocaleString()} sats`}
              </Button>
            </>
          )}

          {/* Phase: Initiating */}
          {state.phase === 'initiating' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">Creating invoice...</p>
            </div>
          )}

          {/* Phase: Awaiting Payment */}
          {state.phase === 'awaiting_payment' && (
            <div className="flex flex-col items-center gap-4">
              <PaymentQRCode
                qrData={state.data.qr_data}
                methodLabel={state.data.method_label}
                amountSats={state.data.payment_intent.amount_sats}
              />

              <PaymentStatusIndicator status="invoice_ready" />

              {state.data.expires_in_seconds && (
                <p className="text-xs text-gray-400">
                  Expires in {Math.ceil(state.data.expires_in_seconds / 60)} minutes
                </p>
              )}

              {/* "I've paid" fallback for Lightning Address */}
              {state.data.payment_intent.payment_method === 'lightning_address' && (
                <Button variant="outline" size="sm" onClick={confirmPaid} className="min-h-11">
                  I&apos;ve paid
                </Button>
              )}
            </div>
          )}

          {/* Phase: Success */}
          {state.phase === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <p className="text-lg font-semibold text-green-700">Payment successful!</p>
              <p className="text-sm text-gray-500">
                {isContribution ? 'Thank you for your support!' : 'Your order has been placed.'}
              </p>
              <Button onClick={handleClose} className="min-h-11">
                Done
              </Button>
            </div>
          )}

          {/* Phase: Expired */}
          {state.phase === 'expired' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <PaymentStatusIndicator status="expired" />
              <p className="text-sm text-gray-500">The invoice has expired. Please try again.</p>
              <Button onClick={reset} variant="outline" className="min-h-11">
                Try Again
              </Button>
            </div>
          )}

          {/* Phase: Error */}
          {state.phase === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <PaymentStatusIndicator status="failed" />
              <p className="text-sm text-red-600">{state.message}</p>
              <Button onClick={reset} variant="outline" className="min-h-11">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
