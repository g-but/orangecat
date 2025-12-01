/**
 * DynamicSidebar Component
 *
 * Generic sidebar that adapts based on user state:
 * - Default: Intro content (configurable)
 * - Active: Field-specific guidance + optional custom content (e.g., currency converter)
 *
 * Purpose: Single component for both project and profile editing.
 * Same familiar UI/UX, just different content.
 *
 * @module components/create
 */

'use client';

import React from 'react';
import { CheckCircle2, ArrowLeftRight, TrendingUp } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { FieldGuidanceContent, DefaultContent } from '@/lib/project-guidance';

// Mock rates (production: fetch from API)
const MOCK_RATES = {
  BTC_TO_USD: 98000,
  BTC_TO_EUR: 92000,
  BTC_TO_CHF: 88000,
};

export type FieldType = string | null;

interface DynamicSidebarProps<T extends string = string> {
  activeField: T | null;
  guidanceContent: Record<NonNullable<T>, FieldGuidanceContent>;
  defaultContent: DefaultContent;
  goalAmount?: number;
  goalCurrency?: 'CHF' | 'USD' | 'EUR' | 'BTC' | 'SATS';
  className?: string;
}

function CurrencyBreakdown({ amount, currency }: { amount: number; currency: string }) {
  const toSatoshis = (): number => {
    if (!amount || isNaN(amount)) {
      return 0;
    }
    switch (currency) {
      case 'SATS':
        return amount;
      case 'BTC':
        return amount * 100_000_000;
      case 'USD':
        return (amount / MOCK_RATES.BTC_TO_USD) * 100_000_000;
      case 'EUR':
        return (amount / MOCK_RATES.BTC_TO_EUR) * 100_000_000;
      case 'CHF':
        return (amount / MOCK_RATES.BTC_TO_CHF) * 100_000_000;
      default:
        return 0;
    }
  };

  const satoshis = toSatoshis();
  const btc = satoshis / 100_000_000;
  const usd = btc * MOCK_RATES.BTC_TO_USD;
  const eur = btc * MOCK_RATES.BTC_TO_EUR;
  const chf = btc * MOCK_RATES.BTC_TO_CHF;

  const fmt = (num: number, decimals: number = 2): string => {
    if (num === 0) {
      return '0';
    }
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <ArrowLeftRight className="w-4 h-4 text-orange-600" />
        <h4 className="text-sm font-semibold text-gray-900">Amount Breakdown</h4>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Bitcoin (BTC)</span>
          <span className="font-mono font-semibold">₿ {btc.toFixed(8)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Satoshis</span>
          <span className="font-mono font-semibold">{fmt(satoshis, 0)} sats</span>
        </div>
        <div className="border-t border-gray-100 pt-2 space-y-1 text-xs">
          <div className="flex justify-between text-gray-500">
            <span>USD</span>
            <span className="font-mono">${fmt(usd)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>EUR</span>
            <span className="font-mono">€{fmt(eur)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>CHF</span>
            <span className="font-mono">CHF {fmt(chf)}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 flex items-start gap-1">
          <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>Live rates. All donations settle in Bitcoin.</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Sidebar that shows default state or contextual guidance
 * Now generic - works for both projects and profiles
 */
export function DynamicSidebar<T extends string = string>({
  activeField,
  guidanceContent,
  defaultContent,
  goalAmount,
  goalCurrency,
  className = '',
}: DynamicSidebarProps<T>) {
  // Default state: Show intro content
  if (!activeField) {
    return (
      <div className={`sticky top-4 ${className}`}>
        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/60">
          <h2 className="font-semibold text-gray-900 mb-2">{defaultContent.title}</h2>
          <p className="text-sm text-gray-700 mb-3">{defaultContent.description}</p>
          <ul className="text-sm text-gray-700 space-y-2">
            {defaultContent.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">{feature.icon}</span>
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
          {defaultContent.hint && (
            <p className="text-xs text-gray-500 mt-3">{defaultContent.hint}</p>
          )}
        </div>
      </div>
    );
  }

  // Active state: Field guidance
  const content = guidanceContent[activeField];

  if (!content) {
    // Fallback if field not found
    return (
      <div className={`sticky top-4 ${className}`}>
        <Card className="p-4">
          <p className="text-sm text-gray-600">No guidance available for this field.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`sticky top-4 ${className}`}>
      <Card className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
            {content.icon}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{content.title}</h3>
            <p className="text-xs text-gray-500">Guidance</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-3">{content.description}</p>

        {/* Tips */}
        <div>
          <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
            Best Practices
          </h4>
          <ul className="space-y-1.5">
            {content.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Examples */}
        {content.examples && content.examples.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
              Examples
            </h4>
            <div className="space-y-1.5">
              {content.examples.map((example, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5 border border-gray-200"
                >
                  {example}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Currency Converter (only for project goal/currency fields with amount) */}
        {(activeField === 'goalAmount' || activeField === 'currency') &&
          goalAmount &&
          goalAmount > 0 &&
          goalCurrency && <CurrencyBreakdown amount={goalAmount} currency={goalCurrency} />}
      </Card>
    </div>
  );
}
