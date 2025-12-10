/**
 * LoanTemplates Component
 *
 * Quick-fill loan presets to reduce blank page anxiety and keep entries consistent.
 */

'use client';

import React from 'react';
import { Banknote, Home, Briefcase, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { type CurrencyCode } from '@/config/currencies';

export interface LoanTemplateData {
  title: string;
  description?: string;
  original_amount: number;
  remaining_balance: number;
  interest_rate?: number;
  monthly_payment?: number;
  currency: CurrencyCode;
  lender_name?: string;
  preferred_terms?: string;
  contact_method?: 'platform' | 'email' | 'phone';
}

export interface LoanTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  badge?: string;
  data: LoanTemplateData;
}

const templates: LoanTemplate[] = [
  {
    id: 'home-renovation',
    name: 'Home Renovation (Secured)',
    icon: <Home className="w-5 h-5 text-green-600" />,
    badge: 'Popular',
    data: {
      title: 'Home Renovation Bridge Loan',
      description:
        'Bridge loan to renovate a 3BR apartment prior to sale. Funds cover kitchen + bathroom update, minor electrical, and staging. Exit via sale within 6 months.',
      original_amount: 45000,
      remaining_balance: 45000,
      interest_rate: 8.5,
      monthly_payment: 800,
      currency: 'CHF',
      lender_name: 'Private lender',
      preferred_terms: '6–9 month term, interest-only, secured with property',
      contact_method: 'platform',
    },
  },
  {
    id: 'working-capital',
    name: 'Working Capital (SMB)',
    icon: <Briefcase className="w-5 h-5 text-blue-600" />,
    data: {
      title: 'Working Capital for Q1 Inventory',
      description:
        'Short-term working capital to purchase inventory for winter season. Historical GM ~38%, 24-month operating history, repeat customers.',
      original_amount: 30000,
      remaining_balance: 30000,
      interest_rate: 10.0,
      monthly_payment: 950,
      currency: 'USD',
      lender_name: 'Community lender',
      preferred_terms: '12-month term, monthly amortization, negotiable prepayment',
      contact_method: 'platform',
    },
  },
  {
    id: 'equipment',
    name: 'Equipment Financing',
    icon: <Wrench className="w-5 h-5 text-orange-600" />,
    data: {
      title: 'CNC Machine Lease-Buyout',
      description:
        'Finance final buyout on 3-axis CNC machine currently under lease. Machine in active production with maintenance logs and uptime metrics available.',
      original_amount: 18000,
      remaining_balance: 18000,
      interest_rate: 7.2,
      monthly_payment: 520,
      currency: 'EUR',
      lender_name: 'Equipment finance partner',
      preferred_terms: '12–18 month amortization, equipment as collateral',
      contact_method: 'platform',
    },
  },
  {
    id: 'btc-collateralized',
    name: 'BTC-Collateralized',
    icon: <Banknote className="w-5 h-5 text-purple-600" />,
    data: {
      title: 'BTC-Collateralized Personal Loan',
      description:
        'Short-term personal loan secured by BTC. Seeking flexible repayment with bullet option at maturity. Price and LTV discussed with lender.',
      original_amount: 12000,
      remaining_balance: 12000,
      interest_rate: 6.0,
      monthly_payment: 0,
      currency: 'USD',
      lender_name: 'P2P lender',
      preferred_terms: '6-month bullet; BTC held in escrow; open to rate discussion',
      contact_method: 'platform',
    },
  },
];

interface LoanTemplatesProps {
  onApply: (data: LoanTemplateData) => void;
}

export function LoanTemplates({ onApply }: LoanTemplatesProps) {
  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Banknote className="w-5 h-5 text-orange-600" />
          <p className="text-sm font-semibold text-gray-900">Loan examples</p>
        </div>
        <p className="text-xs text-gray-500">Click to prefill the form</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map(t => (
          <Card
            key={t.id}
            className="cursor-pointer hover:shadow-md border-2 border-transparent hover:border-orange-200"
            onClick={() => onApply(t.data)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                  {t.icon}
                </div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {t.name}
                  {t.badge && <Badge variant="secondary">{t.badge}</Badge>}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-gray-600 line-clamp-3">{t.data.description}</p>
              <div className="mt-2 text-xs text-gray-700 space-y-1">
                <div>
                  <span className="font-semibold">Amount:</span> {t.data.original_amount} {t.data.currency}
                </div>
                {t.data.interest_rate !== undefined && (
                  <div>
                    <span className="font-semibold">Rate:</span> {t.data.interest_rate}% APR
                  </div>
                )}
                {t.data.monthly_payment !== undefined && (
                  <div>
                    <span className="font-semibold">Monthly:</span> {t.data.monthly_payment} {t.data.currency}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-lg p-3">
        💡 Templates are starting points. Adjust amounts, rates, and collateral to match the actual deal.
      </div>
    </div>
  );
}

