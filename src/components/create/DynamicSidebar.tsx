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

import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, TrendingUp } from 'lucide-react';
import {
  GuidanceDefaultCard,
  GuidanceFallbackCard,
  GuidanceFieldCard,
} from '@/components/create/guidance-shared';
import type { FieldGuidanceContent, DefaultContent } from '@/lib/project-guidance';
import { currencyConverter, formatCurrency } from '@/services/currency';
import type { ExchangeRates } from '@/services/currency/types';

export type FieldType = string | null;

interface DynamicSidebarProps<T extends string = string> {
  activeField: T | null;
  guidanceContent: Record<NonNullable<T>, FieldGuidanceContent>;
  defaultContent: DefaultContent;
  goalAmount?: number;
  goalCurrency?: 'CHF' | 'USD' | 'EUR' | 'BTC';
  className?: string;
}

function CurrencyBreakdown({ amount, currency }: { amount: number; currency: string }) {
  const [rates, setRates] = useState<ExchangeRates | null>(null);

  useEffect(() => {
    currencyConverter
      .getRates()
      .then(setRates)
      .catch(() => {});
  }, []);

  const r = rates ?? { btcToUsd: 97000, btcToEur: 91000, btcToChf: 86000 };

  const toBtc = (): number => {
    if (!amount || isNaN(amount)) {
      return 0;
    }
    switch (currency) {
      case 'BTC':
        return amount;
      case 'USD':
        return amount / r.btcToUsd;
      case 'EUR':
        return amount / r.btcToEur;
      case 'CHF':
        return amount / r.btcToChf;
      default:
        return 0;
    }
  };

  const btc = toBtc();
  const usd = btc * r.btcToUsd;
  const eur = btc * r.btcToEur;
  const chf = btc * r.btcToChf;

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
    <div className="mt-4 pt-4 border-t border-subtle">
      <div className="flex items-center gap-2 mb-3">
        <ArrowLeftRight className="w-4 h-4 text-bitcoinOrange" />
        <h4 className="text-sm font-semibold text-fg-primary">Amount Breakdown</h4>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-fg-secondary">Bitcoin (BTC)</span>
          <span className="font-mono font-semibold">{formatCurrency(btc, 'BTC')}</span>
        </div>
        <div className="border-t border-subtle pt-2 space-y-1 text-xs">
          <div className="flex justify-between text-fg-secondary">
            <span>USD</span>
            <span className="font-mono">${fmt(usd)}</span>
          </div>
          <div className="flex justify-between text-fg-secondary">
            <span>EUR</span>
            <span className="font-mono">€{fmt(eur)}</span>
          </div>
          <div className="flex justify-between text-fg-secondary">
            <span>CHF</span>
            <span className="font-mono">CHF {fmt(chf)}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-subtle">
        <p className="text-xs text-fg-secondary flex items-start gap-1">
          <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{rates ? 'Live rates.' : 'Estimated rates.'} All funding settles in Bitcoin.</span>
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
        <GuidanceDefaultCard content={defaultContent} />
      </div>
    );
  }

  // Active state: Field guidance
  const content = guidanceContent[activeField];

  if (!content) {
    // Fallback if field not found
    return (
      <div className={`sticky top-4 ${className}`}>
        <GuidanceFallbackCard />
      </div>
    );
  }

  return (
    <div className={`sticky top-4 ${className}`}>
      <GuidanceFieldCard content={content}>
        {/* Currency Converter (only for project goal/currency fields with amount) */}
        {(activeField === 'goalAmount' || activeField === 'currency') &&
          goalAmount &&
          goalAmount > 0 &&
          goalCurrency && <CurrencyBreakdown amount={goalAmount} currency={goalCurrency} />}
      </GuidanceFieldCard>
    </div>
  );
}
