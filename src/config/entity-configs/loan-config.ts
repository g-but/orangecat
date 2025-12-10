/**
 * LOAN ENTITY CONFIGURATION
 *
 * Defines the form structure, validation, and guidance for loan creation.
 *
 * Created: 2025-12-06
 * Last Modified: 2025-12-06
 * Last Modified Summary: Initial loan configuration
 */

import { DollarSign } from 'lucide-react';
import { loanSchema, type LoanFormData } from '@/lib/validation';
import {
  loanGuidanceContent,
  loanDefaultGuidance,
} from '@/lib/entity-guidance/loan-guidance';
import type { EntityConfig, FieldGroup } from '@/components/create/types';

// ==================== FIELD GROUPS ====================

const fieldGroups: FieldGroup[] = [
  {
    id: 'basic',
    title: 'Loan Details',
    description: 'Basic information about your loan listing',
    fields: [
      {
        name: 'title',
        label: 'Loan Title',
        type: 'text',
        placeholder: 'e.g., Business Expansion Loan',
        required: true,
        colSpan: 2,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Describe your loan needs and how funds will be used...',
        rows: 4,
        required: true,
        colSpan: 2,
        hint: 'Be specific about what you need the loan for and your repayment plan.',
      },
    ],
  },
  {
    id: 'loan_terms',
    title: 'Loan Terms',
    description: 'Set the loan amount, interest rate, and repayment terms',
    fields: [
      {
        name: 'original_amount',
        label: 'Loan Amount',
        type: 'currency',
        placeholder: '10000',
        required: true,
        hint: 'The total amount you want to borrow',
      },
      {
        name: 'remaining_balance',
        label: 'Remaining Balance',
        type: 'currency',
        placeholder: '10000',
        required: true,
        hint: 'Usually same as loan amount for new loans',
      },
      {
        name: 'interest_rate',
        label: 'Interest Rate (%)',
        type: 'number',
        placeholder: '5.0',
        min: 0,
        max: 100,
        step: 0.1,
        hint: 'Annual interest rate you\'re willing to pay',
      },
    ],
  },
  {
    id: 'bitcoin',
    title: 'Bitcoin & Payments',
    description: 'Bitcoin addresses for loan payments',
    fields: [
      {
        name: 'bitcoin_address',
        label: 'Bitcoin Address',
        type: 'bitcoin_address',
        placeholder: 'bc1q... or 1...',
        hint: 'Your Bitcoin address for loan payments',
      },
      {
        name: 'lightning_address',
        label: 'Lightning Address',
        type: 'text',
        placeholder: 'you@lightning.address',
        hint: 'Optional: Lightning Network address for instant payments',
      },
    ],
  },
  {
    id: 'additional',
    title: 'Additional Information',
    description: 'Optional details to help lenders understand your loan',
    fields: [
      {
        name: 'loan_category_id',
        label: 'Loan Category',
        type: 'select',
        options: [
          { value: 'personal', label: 'Personal Loan' },
          { value: 'business', label: 'Business Loan' },
          { value: 'education', label: 'Education Loan' },
          { value: 'home_improvement', label: 'Home Improvement' },
          { value: 'debt_consolidation', label: 'Debt Consolidation' },
          { value: 'emergency', label: 'Emergency Loan' },
          { value: 'other', label: 'Other' },
        ],
        hint: 'Choose the category that best describes your loan purpose',
      },
      {
        name: 'fulfillment_type',
        label: 'Fulfillment Type',
        type: 'select',
        options: [
          { value: 'manual', label: 'Manual Repayment' },
          { value: 'automatic', label: 'Automatic Deduction' },
        ],
        hint: 'How you prefer to make loan repayments',
      },
    ],
  },
];

// ==================== CONFIGURATION ====================

export const loanConfig: EntityConfig<LoanFormData> = {
  // Entity metadata
  type: 'loan',
  name: 'Loan',
  namePlural: 'Loans',

  // Icons
  icon: DollarSign,
  colorTheme: 'blue',

  // Navigation
  backUrl: '/loans',
  successUrl: '/loans',

  // API configuration
  apiEndpoint: '/api/loans',

  // UI configuration
  pageTitle: 'Create Loan Listing',
  pageDescription: 'List your loan needs and connect with peer-to-peer lenders.',
  formTitle: 'Loan Details',
  formDescription: 'Set the loan amount, interest rate, and repayment terms',

  // Form configuration
  fieldGroups,
  validationSchema: loanSchema,
  defaultValues: {
    title: '',
    description: '',
    original_amount: 0,
    remaining_balance: 0,
    interest_rate: undefined,
    bitcoin_address: '',
    lightning_address: '',
    loan_category_id: '',
    fulfillment_type: 'manual',
  },

  // Guidance
  guidanceContent: loanGuidanceContent,
  defaultGuidance: loanDefaultGuidance,
};