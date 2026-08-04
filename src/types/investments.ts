/**
 * INVESTMENT SYSTEM TYPES
 *
 * Type definitions for structured investment deals — equity, revenue-share,
 * profit participation, and token-based returns.
 */

import { type CurrencyCode } from '@/config/currencies';
import { type InvestmentStatus } from '@/config/database-constants';

type InvestmentType = 'equity' | 'revenue_share' | 'profit_share' | 'token' | 'other';
type ReturnFrequency = 'monthly' | 'quarterly' | 'annually' | 'at_exit' | 'custom';

export interface Investment {
  id: string;
  actor_id: string;
  title: string;
  description?: string;
  investment_type: InvestmentType;
  target_amount: number;
  minimum_investment: number;
  maximum_investment?: number;
  total_raised: number;
  currency: CurrencyCode;
  expected_return_rate?: number;
  return_frequency?: ReturnFrequency;
  term_months?: number;
  start_date?: string;
  end_date?: string;
  status: InvestmentStatus;
  risk_level?: 'low' | 'medium' | 'high';
  terms?: string;
  is_public: boolean;
  /** Not a column — enriched at read time from the funding ledger when available. */
  investor_count?: number;
  bitcoin_address?: string;
  lightning_address?: string;
  wallet_id?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  // Index signature for BaseEntity compatibility
  [key: string]: unknown;
}

export interface CreateInvestmentRequest {
  title: string;
  description: string;
  investment_type: InvestmentType;
  target_amount: number;
  minimum_investment: number;
  maximum_investment?: number;
  currency?: CurrencyCode;
  expected_return_rate?: number;
  return_frequency?: ReturnFrequency;
  term_months?: number;
  end_date?: string;
  risk_level?: 'low' | 'medium' | 'high';
  terms?: string;
  is_public?: boolean;
  bitcoin_address?: string;
  lightning_address?: string;
}
