/**
 * Loan Field Guidance Content
 *
 * Single source of truth for loan creation guidance.
 * Used by GuidancePanel to provide contextual help and examples.
 *
 * Created: 2025-12-06
 * Last Modified: 2025-12-06
 * Last Modified Summary: Initial loan guidance content
 */

import React from 'react';
import {
  DollarSign,
  FileText,
  Target,
  Bitcoin,
  Settings,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import type { GuidanceContent, DefaultGuidance } from '@/components/create/types';

export type LoanFieldType =
  | 'title'
  | 'description'
  | 'original_amount'
  | 'remaining_balance'
  | 'interest_rate'
  | 'bitcoin_address'
  | 'lightning_address'
  | 'loan_category_id'
  | 'fulfillment_type'
  | null;

export const loanGuidanceContent: Record<NonNullable<LoanFieldType>, GuidanceContent> = {
  title: {
    icon: React.createElement(DollarSign, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Loan Title',
    description:
      'Choose a clear, descriptive title that explains what you need the loan for.',
    tips: [
      'Be specific about the loan purpose',
      'Include the type of loan or project',
      'Keep it concise but informative',
      'Use action-oriented language',
      'Avoid vague titles like "Loan Needed"',
    ],
    examples: [
      'Business Expansion Loan - $50,000',
      'Education Loan for Coding Bootcamp',
      'Home Solar Panel Installation',
      'Emergency Medical Loan',
    ],
  },
  description: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Loan Description',
    description:
      'Provide detailed information about your loan needs, repayment plan, and how funds will be used.',
    tips: [
      'Explain exactly what you need the money for',
      'Include your repayment timeline and plan',
      'Share your credit history and reliability',
      'Mention any collateral or guarantees',
      'Be transparent about risks and challenges',
    ],
    examples: [
      'Seeking $25,000 to expand my bakery business. Funds will purchase new equipment and hire staff...',
      'Need $10,000 for emergency car repair. Excellent credit history, will repay within 12 months...',
    ],
  },
  original_amount: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Loan Amount',
    description:
      'The total amount you want to borrow. Be realistic about what you can afford to repay.',
    tips: [
      'Calculate based on your repayment capacity',
      'Consider both principal and interest payments',
      'Think about your monthly budget constraints',
      'Include a small buffer for unexpected costs',
      'Start with smaller amounts if unsure',
    ],
    examples: [
      '$15,000 for equipment purchase',
      '$5,000 for working capital',
      '$30,000 for business expansion',
    ],
  },
  remaining_balance: {
    icon: React.createElement(DollarSign, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Remaining Balance',
    description:
      'The outstanding amount still owed. For new loans, this equals the original amount.',
    tips: [
      'For new loans, same as original amount',
      'For refinanced loans, current outstanding balance',
      'Include any fees or interest already accrued',
      'Be accurate about what you still owe',
      'Update as payments are made',
    ],
    examples: [
      'Same as loan amount for new loans',
      '$18,000 remaining on $20,000 original loan',
      'Current balance after partial payments',
    ],
  },
  interest_rate: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Interest Rate',
    description:
      'The annual interest rate you\'re willing to pay. Competitive rates attract more lenders.',
    tips: [
      'Research current market rates',
      'Consider your ability to pay interest',
      'Start with competitive rates',
      'Higher rates may attract more lenders',
      'Lower rates mean easier repayment',
    ],
    examples: [
      '5-7% for business loans',
      '8-12% for personal loans',
      '3-5% for secured loans',
    ],
  },
  bitcoin_address: {
    icon: React.createElement(Bitcoin, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Bitcoin Address',
    description:
      'Your Bitcoin address where loan payments and repayments will be sent.',
    tips: [
      'Use a fresh address for loan transactions',
      'Consider using a multi-signature wallet',
      'Keep private keys secure and backed up',
      'Use a hardware wallet for large amounts',
      'Document the address securely',
    ],
    examples: [
      'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhfe2s',
      'Multi-signature wallet for security',
      'Hardware wallet address',
    ],
  },
  lightning_address: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Lightning Address',
    description:
      'Lightning Network address for instant, low-fee loan payments and repayments.',
    tips: [
      'Format: yourname@domain.com',
      'Enables instant loan disbursements',
      'Lower fees for regular repayments',
      'Great for international transactions',
      'Works alongside regular Bitcoin address',
    ],
    examples: [
      'loan@borrower.address',
      'business@lightning.gifts',
      'personal@zbd.gg',
    ],
  },
  loan_category_id: {
    icon: React.createElement(Tag, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Loan Category',
    description:
      'Categorize your loan to help lenders understand the purpose and risk level.',
    tips: [
      'Choose the most accurate category',
      'Different categories have different risk profiles',
      'Business loans often get better rates',
      'Be honest about the loan purpose',
      'Categories help with lender matching',
    ],
    examples: [
      'Business: Higher chance of approval',
      'Personal: For individual needs',
      'Education: Often lower interest rates',
    ],
  },
  fulfillment_type: {
    icon: React.createElement(Settings, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Fulfillment Type',
    description:
      'How you prefer to make loan repayments - manually or through automatic deductions.',
    tips: [
      'Manual: You make payments yourself',
      'Automatic: System deducts payments',
      'Automatic reduces risk of missed payments',
      'Manual gives you more control',
      'Consider your cash flow preferences',
    ],
    examples: [
      'Manual: Full control over timing',
      'Automatic: Never miss a payment',
      'Mixed approach based on situation',
    ],
  },
};

export const loanDefaultGuidance: DefaultGuidance = {
  title: 'Create a Compelling Loan Listing',
  description:
    'Peer-to-peer lending connects borrowers with lenders directly. Create a clear, trustworthy loan listing to attract competitive offers.',
  features: [
    {
      icon: React.createElement(FileText, { className: 'w-4 h-4 text-green-600' }),
      text: 'Set transparent loan terms and rates',
    },
    {
      icon: React.createElement(Target, { className: 'w-4 h-4 text-green-600' }),
      text: 'Connect directly with individual lenders',
    },
    {
      icon: React.createElement(CheckCircle2, { className: 'w-4 h-4 text-green-600' }),
      text: 'No traditional bank approval process',
    },
    {
      icon: React.createElement(Bitcoin, { className: 'w-4 h-4 text-green-600' }),
      text: 'Bitcoin-powered payments and repayments',
    },
    {
      icon: React.createElement(Settings, { className: 'w-4 h-4 text-green-600' }),
      text: 'Flexible terms negotiated with lenders',
    },
  ],
};