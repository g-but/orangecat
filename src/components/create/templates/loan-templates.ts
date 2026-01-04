/**
 * Loan Templates
 *
 * Template definitions for loan creation.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

import React from 'react';
import { Briefcase, AlertCircle, GraduationCap, Home, CreditCard, Wrench } from 'lucide-react';
import type { EntityTemplate } from '../types';
import type { LoanFormData } from '@/lib/validation';

export const LOAN_TEMPLATES: EntityTemplate<LoanFormData>[] = [
  {
    id: 'business-expansion',
    icon: React.createElement(Briefcase, { className: 'w-4 h-4' }),
    name: 'Business Expansion',
    tagline: 'Grow your business with capital.',
    defaults: {
      title: 'Business Expansion Loan',
      description:
        'Seeking funding to expand operations, hire staff, purchase equipment, or enter new markets. Clear repayment plan based on projected revenue growth.',
      original_amount: 50000000,
      remaining_balance: 50000000,
      interest_rate: 8.0,
      loan_category_id: 'business',
      fulfillment_type: 'manual',
    },
  },
  {
    id: 'personal-emergency',
    icon: React.createElement(AlertCircle, { className: 'w-4 h-4' }),
    name: 'Personal Emergency',
    tagline: 'Fast funding for urgent needs.',
    defaults: {
      title: 'Personal Emergency Loan',
      description:
        'Urgent personal financial need. Will repay within agreed timeframe. Clear repayment plan and income verification available.',
      original_amount: 5000000,
      remaining_balance: 5000000,
      interest_rate: 12.0,
      loan_category_id: 'emergency',
      fulfillment_type: 'manual',
    },
  },
  {
    id: 'education',
    icon: React.createElement(GraduationCap, { className: 'w-4 h-4' }),
    name: 'Education Loan',
    tagline: 'Invest in your future.',
    defaults: {
      title: 'Education Loan',
      description:
        'Funding for tuition, books, and educational expenses. Repayment plan aligned with graduation and career start date.',
      original_amount: 20000000,
      remaining_balance: 20000000,
      interest_rate: 6.0,
      loan_category_id: 'education',
      fulfillment_type: 'manual',
    },
  },
  {
    id: 'home-improvement',
    icon: React.createElement(Home, { className: 'w-4 h-4' }),
    name: 'Home Improvement',
    tagline: 'Renovate and upgrade your home.',
    defaults: {
      title: 'Home Improvement Loan',
      description:
        'Funding for home renovations, repairs, or upgrades. Property value and equity considered for collateral.',
      original_amount: 30000000,
      remaining_balance: 30000000,
      interest_rate: 7.0,
      loan_category_id: 'home_improvement',
      fulfillment_type: 'manual',
    },
  },
  {
    id: 'debt-consolidation',
    icon: React.createElement(CreditCard, { className: 'w-4 h-4' }),
    name: 'Debt Consolidation',
    tagline: 'Simplify and reduce your debt.',
    defaults: {
      title: 'Debt Consolidation Loan',
      description:
        'Consolidating multiple debts into a single loan with better terms. Lower interest rate and simplified repayment schedule.',
      original_amount: 10000000,
      remaining_balance: 10000000,
      interest_rate: 9.0,
      loan_category_id: 'debt_consolidation',
      fulfillment_type: 'automatic',
    },
  },
  {
    id: 'equipment-purchase',
    icon: React.createElement(Wrench, { className: 'w-4 h-4' }),
    name: 'Equipment Purchase',
    tagline: 'Buy tools and equipment for your work.',
    defaults: {
      title: 'Equipment Purchase Loan',
      description:
        'Funding to purchase professional equipment, tools, or machinery needed for business operations. Equipment serves as collateral.',
      original_amount: 15000000,
      remaining_balance: 15000000,
      interest_rate: 7.5,
      loan_category_id: 'business',
      fulfillment_type: 'manual',
    },
  },
];


