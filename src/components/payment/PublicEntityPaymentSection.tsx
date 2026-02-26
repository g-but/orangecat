/**
 * PublicEntityPaymentSection — Replaces static PublicEntityCTA on entity pages
 *
 * Shows contextual UI based on auth/ownership state:
 * - Not logged in: "Sign in to buy/support" CTA
 * - Logged in, IS the seller: SellerWalletBanner (prompt to connect wallet)
 * - Logged in, NOT the seller: PaymentButton (opens PaymentDialog)
 */

'use client';

import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useSellerPaymentMethods } from '@/hooks/useSellerPaymentMethods';
import { PaymentButton } from './PaymentButton';
import { SellerWalletBanner } from './SellerWalletBanner';
import type { EntityType } from '@/config/entity-registry';
import { ROUTES } from '@/config/routes';

interface PublicEntityPaymentSectionProps {
  entityType: EntityType;
  entityId: string;
  entityTitle: string;
  /** Price in sats (for fixed_price entities) */
  priceSats?: number;
  /** Seller's profile/actor ID for wallet lookup (null if no seller found) */
  sellerProfileId: string | null;
  /** Seller's auth.users ID for self-purchase detection (null if no seller found) */
  sellerUserId: string | null;
  /** Redirect path after sign-in */
  signInRedirect: string;
}

export function PublicEntityPaymentSection({
  entityType,
  entityId,
  entityTitle,
  priceSats,
  sellerProfileId,
  sellerUserId,
  signInRedirect,
}: PublicEntityPaymentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const { hasWallet, loading: walletLoading } = useSellerPaymentMethods(sellerProfileId);

  // Not logged in — show sign-in CTA
  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Link href={`${ROUTES.AUTH}?mode=login&from=${signInRedirect}`} className="block">
            <Button className="w-full gap-2 min-h-11">
              <LogIn className="w-4 h-4" />
              Sign in to continue
            </Button>
          </Link>
          <p className="text-xs text-gray-500 text-center">
            Sign in to buy or support with Bitcoin
          </p>
        </CardContent>
      </Card>
    );
  }

  // Logged in, IS the seller — show wallet banner
  const isOwner = !!sellerUserId && user?.id === sellerUserId;
  if (isOwner) {
    return <SellerWalletBanner isOwner={true} hasWallet={hasWallet} />;
  }

  // Logged in, NOT the seller — show payment button
  if (walletLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <div className="h-11 w-full animate-pulse rounded-md bg-gray-100" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <PaymentButton
          entityType={entityType}
          entityId={entityId}
          entityTitle={entityTitle}
          priceSats={priceSats}
          sellerProfileId={sellerProfileId ?? undefined}
          sellerHasWallet={hasWallet}
          className="w-full min-h-11"
        />
      </CardContent>
    </Card>
  );
}
