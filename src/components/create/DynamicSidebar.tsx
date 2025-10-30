/**
 * DynamicSidebar Component
 *
 * Single sidebar that adapts based on user state:
 * - Default: "What's a Project?" intro
 * - Active: Field-specific guidance + currency converter
 *
 * Purpose: Eliminate duplication, provide contextual help exactly when needed.
 *
 * @module components/create
 */

'use client';

import React from 'react';
import {
  Target,
  FileText,
  DollarSign,
  Coins,
  Bitcoin,
  Tag,
  Wallet,
  Lightbulb,
  CheckCircle2,
  Heart,
  Shield,
  Users,
  ArrowLeftRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import Card from '@/components/ui/Card';

export type FieldType =
  | 'title'
  | 'description'
  | 'goalAmount'
  | 'currency'
  | 'fundingPurpose'
  | 'bitcoinAddress'
  | 'categories'
  | null;

interface DynamicSidebarProps {
  activeField: FieldType;
  goalAmount?: number;
  goalCurrency?: 'CHF' | 'USD' | 'EUR' | 'BTC' | 'SATS';
  className?: string;
}

// Mock rates
const MOCK_RATES = {
  BTC_TO_USD: 98000,
  BTC_TO_EUR: 92000,
  BTC_TO_CHF: 88000,
};

const guidanceContent: Record<
  NonNullable<FieldType>,
  {
    icon: React.ReactNode;
    title: string;
    description: string;
    tips: string[];
    examples?: string[];
  }
> = {
  title: {
    icon: <Target className="w-5 h-5 text-orange-600" />,
    title: 'Project Title',
    description:
      'Your title is the first thing people see. Make it clear, specific, and inspiring.',
    tips: [
      'Keep it under 60 characters',
      'Be specific: "Community Garden in Basel" > "Garden Project"',
      'Avoid jargon',
      'Make it memorable',
    ],
    examples: ['Community Garden Project', 'Local Animal Shelter', 'Open Source Bitcoin Tools'],
  },
  description: {
    icon: <FileText className="w-5 h-5 text-orange-600" />,
    title: 'Project Description',
    description: 'Tell your story. What problem are you solving? Why does it matter?',
    tips: [
      'Start with the problem',
      'Explain your solution',
      'Share why this matters',
      'Be authentic and personal',
    ],
  },
  goalAmount: {
    icon: <DollarSign className="w-5 h-5 text-orange-600" />,
    title: 'Goal Amount',
    description: 'Set a funding target. Optional but helps donors understand your needs.',
    tips: ['Be realistic and specific', 'Break down major costs', 'Can be updated later'],
  },
  currency: {
    icon: <Coins className="w-5 h-5 text-orange-600" />,
    title: 'Display Currency',
    description: 'Choose how to display your goal. All donations are received in Bitcoin.',
    tips: [
      '⚠️ This is DISPLAY ONLY',
      'All donations settle to your Bitcoin wallet',
      'CHF/USD/EUR help local donors',
      'SATS is native Bitcoin',
    ],
  },
  fundingPurpose: {
    icon: <Lightbulb className="w-5 h-5 text-orange-600" />,
    title: 'Funding Purpose',
    description: 'What will donations be used for? Transparency builds trust.',
    tips: ['Be specific about expenses', 'Use bullet points', 'Update as needs evolve'],
  },
  bitcoinAddress: {
    icon: <Wallet className="w-5 h-5 text-orange-600" />,
    title: 'Bitcoin Address',
    description: 'Where donations will be sent. Can add later, but needed to receive funds.',
    tips: [
      'Use a wallet YOU control',
      'Starts with bc1, 1, or 3',
      'Lightning looks like email@domain.com',
      "⚠️ Don't have a wallet? Get one first!",
    ],
  },
  categories: {
    icon: <Tag className="w-5 h-5 text-orange-600" />,
    title: 'Categories',
    description: 'Help people discover your project.',
    tips: [
      'Choose 1-3 most relevant',
      'Improves discoverability',
      'First is your primary category',
    ],
  },
};

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
 */
export function DynamicSidebar({
  activeField,
  goalAmount,
  goalCurrency,
  className = '',
}: DynamicSidebarProps) {
  // Default state: What's a Project
  if (!activeField) {
    return (
      <div className={`sticky top-4 ${className}`}>
        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/60">
          <h2 className="font-semibold text-gray-900 mb-2">What's a Project?</h2>
          <p className="text-sm text-gray-700 mb-3">
            A project is any initiative that needs funding — from personal goals to community
            causes. Accept Bitcoin donations directly to your wallet.
          </p>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start gap-2">
              <Heart className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              Accept Bitcoin donations instantly
            </li>
            <li className="flex items-start gap-2">
              <Users className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              Rally supporters and share updates
            </li>
            <li className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              Transparent and self-custodial by design
            </li>
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            💡 Click on any field to get specific guidance
          </p>
        </div>
      </div>
    );
  }

  // Active state: Field guidance
  const content = guidanceContent[activeField];

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

        {/* Currency Converter (only for goal/currency fields with amount) */}
        {(activeField === 'goalAmount' || activeField === 'currency') &&
          goalAmount &&
          goalAmount > 0 &&
          goalCurrency && <CurrencyBreakdown amount={goalAmount} currency={goalCurrency} />}
      </Card>
    </div>
  );
}
