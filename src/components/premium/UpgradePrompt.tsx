'use client';

import { Lock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { usePremiumFeature, getPremiumTierDetails } from '@/hooks/usePremiumFeature';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import type { PremiumFeature } from '@/config/premium';

interface UpgradePromptProps {
  /** The premium feature being gated */
  feature: PremiumFeature;
  /** Optional children to render when the user HAS access */
  children?: React.ReactNode;
  /** If true, renders nothing instead of the prompt when user lacks access */
  hideWhenLocked?: boolean;
}

/**
 * UpgradePrompt — conditionally renders children or an upgrade card.
 *
 * If the user's tier grants access to `feature`, renders `children`.
 * Otherwise, shows a compact upgrade prompt with tier info.
 *
 * Uses usePremiumFeature hook + PREMIUM_TIERS config (SSOT: src/config/premium.ts).
 */
export function UpgradePrompt({ feature, children, hideWhenLocked = false }: UpgradePromptProps) {
  const { hasAccess, requiredTier, featureLabel } = usePremiumFeature(feature);
  const { formatAmount } = useDisplayCurrency();

  if (hasAccess) {
    return <>{children}</>;
  }

  if (hideWhenLocked) {
    return null;
  }

  const tierDetails = getPremiumTierDetails(requiredTier);

  return (
    <Card className="border-orange-200 bg-orange-50/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
            <Lock className="h-4 w-4 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{featureLabel}</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Requires {tierDetails.label} plan
              {tierDetails.price_sats > 0 && (
                <> &middot; {formatAmount(tierDetails.price_sats)}/mo</>
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" className="flex-shrink-0" disabled>
            Upgrade
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default UpgradePrompt;
