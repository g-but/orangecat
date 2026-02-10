'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Check, Zap } from 'lucide-react';
import { AI_CREDITS_CONFIG } from '@/config/ai-credits';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

/**
 * AICreditsPricing — displays AI credit tiers and per-operation costs
 * Reads from AI_CREDITS_CONFIG (SSOT: src/config/ai-credits.ts).
 */
export function AICreditsPricing() {
  const { formatAmount } = useDisplayCurrency();

  const tiers = Object.entries(AI_CREDITS_CONFIG.tiers);
  const operations = Object.entries(AI_CREDITS_CONFIG.operations);

  return (
    <div className="space-y-6">
      {/* Tiers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-yellow-500" />
            Credit Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tiers.map(([key, tier]) => (
              <div
                key={key}
                className={`rounded-lg border p-4 ${
                  key === 'pro' ? 'border-orange-300 bg-orange-50/50' : 'border-gray-200'
                }`}
              >
                <div className="font-semibold text-sm">{tier.label}</div>
                <div className="text-lg font-bold mt-1">
                  {tier.price_sats === 0 ? 'Free' : `${formatAmount(tier.price_sats)}/mo`}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatAmount(tier.monthly_credits_sats)} credits/month
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-green-700">
                    <Check className="h-3 w-3" />
                    {tier.label === 'Free' ? 'No payment required' : 'Priority processing'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operation Costs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cost per Operation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {operations.map(([key, op]) => (
              <div
                key={key}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 text-sm"
              >
                <span>{op.label}</span>
                <span className="font-medium text-orange-700">{formatAmount(op.cost_sats)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AICreditsPricing;
