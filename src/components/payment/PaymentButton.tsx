/**
 * PaymentButton — "Buy Now" / "Support" button on entity pages
 *
 * Opens the PaymentDialog. Disabled if seller has no wallet.
 * Uses entity registry to determine button text and behavior.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Wallet } from 'lucide-react';
import { PaymentDialog } from './PaymentDialog';
import { getEntityMetadata, type EntityType } from '@/config/entity-registry';

interface PaymentButtonProps {
  entityType: EntityType;
  entityId: string;
  entityTitle: string;
  /** Price in sats (for fixed_price entities) */
  priceSats?: number;
  /** Seller's profile ID */
  sellerProfileId?: string;
  /** Whether the seller has a wallet connected */
  sellerHasWallet?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function PaymentButton({
  entityType,
  entityId,
  entityTitle,
  priceSats,
  sellerProfileId,
  sellerHasWallet = true,
  className,
}: PaymentButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const meta = getEntityMetadata(entityType);

  // Don't render for entities that aren't purchasable
  if (meta.paymentPattern === 'none') {
    return null;
  }

  const isContribution = meta.paymentPattern === 'contribution';
  const buttonText = isContribution ? 'Support' : 'Buy Now';
  const disabled = !sellerHasWallet;

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        disabled={disabled}
        className={className}
        size="lg"
      >
        <Wallet className="mr-2 h-4 w-4" />
        {disabled ? 'No wallet connected' : buttonText}
        {!isContribution && priceSats && !disabled && (
          <span className="ml-1 opacity-75">({priceSats.toLocaleString()} sats)</span>
        )}
      </Button>

      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entityType={entityType}
        entityId={entityId}
        entityTitle={entityTitle}
        priceSats={priceSats}
        sellerProfileId={sellerProfileId}
      />
    </>
  );
}
