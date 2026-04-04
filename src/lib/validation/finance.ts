import { z } from 'zod';
import { CURRENCY_CODES } from '@/config/currencies';
import { ENTITY_TYPES } from '@/config/entity-registry';
import { lightningAddressSchema, optionalText } from './base';

/**
 * Collateral item for loans.
 * Matches CollateralItem interface in components/create/collateral/CollateralSelector.tsx
 * and the shape used in domain/loans/service.ts.
 * Stored as JSONB array in the database.
 *
 * Uses .passthrough() to allow additional fields without breaking existing data.
 */
export const collateralItemSchema = z
  .object({
    id: z.string().optional(),
    type: z.string().max(50).optional(),
    name: z.string().max(200).optional(),
    value: z.number().min(0).optional(),
    currency: z.string().max(10).optional(),
    description: z.string().max(500).optional(),
    metadata: z
      .object({
        verification_status: z.string().optional(),
        balance_btc: z.number().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

// Asset validation
export const assetSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters'),
  type: z.enum([
    'real_estate',
    'vehicle',
    'luxury',
    'equipment',
    'computing',
    'recreational',
    'robot',
    'drone',
    'business',
    'securities',
    'other',
  ]),
  description: optionalText(2000),
  location: optionalText(200),
  estimated_value: z.number().positive().optional().nullable(),
  currency: z.enum(CURRENCY_CODES).optional(),
  documents: z.array(z.string().url()).optional().nullable().default([]),

  // Sale options
  is_for_sale: z.boolean().optional().default(false),
  sale_price_btc: z.number().positive().optional().nullable(),

  // Rental options
  is_for_rent: z.boolean().optional().default(false),
  rental_price_btc: z
    .number()
    .positive()
    .optional()
    .nullable(),
  rental_period_type: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional().default('daily'),
  min_rental_period: z.number().int().positive().optional().default(1),
  max_rental_period: z.number().int().positive().optional().nullable(),

  // Deposit
  requires_deposit: z.boolean().optional().default(false),
  deposit_amount_btc: z
    .number()
    .positive()
    .optional()
    .nullable(),

  // Visibility
  show_on_profile: z.boolean().optional().default(true),
});

// Loan validation
export const loanSchema = z.object({
  // Loan type: new_request (seeking new loan) or existing_refinance (refinancing existing)
  loan_type: z.enum(['new_request', 'existing_refinance']).default('new_request'),

  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be at most 1000 characters'),
  loan_category_id: optionalText(),
  original_amount: z.number().positive('Amount must be greater than 0'),
  remaining_balance: z.number().positive('Balance must be greater than 0'),
  interest_rate: z.number().min(0).max(100).optional().nullable(),
  bitcoin_address: optionalText(),
  lightning_address: lightningAddressSchema,
  fulfillment_type: z.enum(['manual', 'automatic']).default('manual'),
  currency: z.string().optional(),

  // Fields specific to existing loans (refinancing)
  current_lender: optionalText(100),
  current_interest_rate: z.number().min(0).max(100).optional().nullable(),
  monthly_payment: z.number().min(0).optional().nullable(),
  desired_rate: z.number().min(0).max(100).optional().nullable(),

  // Collateral (array of collateral items)
  collateral: z.array(collateralItemSchema).optional().default([]),
});

// Investment validation
export const investmentSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must be at most 100 characters'),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description must be at most 2000 characters'),
    investment_type: z
      .enum(['equity', 'revenue_share', 'profit_share', 'token', 'other'])
      .default('revenue_share'),
    target_amount: z.number().positive('Target amount must be greater than 0'),
    minimum_investment: z.number().positive('Minimum investment must be greater than 0'),
    maximum_investment: z.number().positive().optional().nullable(),
    expected_return_rate: z.number().min(0).max(1000).optional().nullable(),
    return_frequency: z
      .enum(['monthly', 'quarterly', 'annually', 'at_exit', 'custom'])
      .optional()
      .nullable(),
    term_months: z.number().int().positive().optional().nullable(),
    end_date: optionalText(),
    risk_level: z.enum(['low', 'medium', 'high']).optional().nullable(),
    terms: optionalText(5000),
    is_public: z.boolean().optional().default(false),
    bitcoin_address: optionalText(),
    lightning_address: lightningAddressSchema,
    currency: z.enum(CURRENCY_CODES).optional(),
  })
  .refine(
    data =>
      !data.maximum_investment ||
      !data.minimum_investment ||
      data.minimum_investment <= data.maximum_investment,
    {
      message: 'Maximum investment must be greater than or equal to minimum investment',
      path: ['maximum_investment'],
    }
  );

// ---------------------------------------------------------------------------
// Wallet validation
// ---------------------------------------------------------------------------

const walletCategoryValues = [
  'general',
  'rent',
  'food',
  'medical',
  'education',
  'emergency',
  'transportation',
  'utilities',
  'projects',
  'legal',
  'entertainment',
  'custom',
] as const;

const walletBehaviorTypeValues = ['general', 'recurring_budget', 'one_time_goal'] as const;

const budgetPeriodValues = [
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'yearly',
  'custom',
] as const;

const allowedCategoryIcons = [
  '💰',
  '🏠',
  '🍔',
  '💊',
  '🎓',
  '🚨',
  '🚗',
  '💡',
  '🚀',
  '⚖️',
  '🎭',
  '📦',
] as const;

/** Schema for POST /api/wallets — create a new wallet */
export const walletCreateSchema = z
  .object({
    // Entity ownership — exactly one must be provided
    profile_id: z.string().uuid('Invalid profile ID format').optional(),
    project_id: z.string().uuid('Invalid project ID format').optional(),

    // Core fields
    label: z
      .string()
      .min(1, 'Wallet name is required')
      .max(100, 'Wallet name must be 100 characters or less'),
    description: z
      .string()
      .max(500, 'Description must be 500 characters or less')
      .optional()
      .nullable(),
    address_or_xpub: z.string().min(1, 'Address or xpub is required').max(200),
    lightning_address: z.string().max(200).optional().nullable(),

    // Category
    category: z.enum(walletCategoryValues).default('general'),
    category_icon: z.enum(allowedCategoryIcons).optional(),

    // Behavior
    behavior_type: z.enum(walletBehaviorTypeValues).default('general'),
    budget_amount: z.number().positive().optional().nullable(),
    budget_period: z.enum(budgetPeriodValues).optional().nullable(),

    // Goal
    goal_amount: z
      .number()
      .positive()
      .max(1_000_000_000, 'Goal amount too large')
      .optional()
      .nullable(),
    goal_currency: z.enum(CURRENCY_CODES).optional().nullable(),
    goal_deadline: z.string().optional().nullable(),

    // Display
    is_primary: z.boolean().optional(),
    force_duplicate: z.boolean().optional(),
  })
  .refine(data => (data.profile_id && !data.project_id) || (!data.profile_id && data.project_id), {
    message: 'Exactly one of profile_id or project_id is required',
    path: ['profile_id'],
  });

/** Schema for PATCH /api/wallets/[id] — update an existing wallet */
export const walletUpdateSchema = z
  .object({
    label: z.string().min(1, 'Label cannot be empty').max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    address_or_xpub: z.string().min(1).max(200).optional(),
    category: z.enum(walletCategoryValues).optional(),
    category_icon: z.enum(allowedCategoryIcons).optional(),
    goal_amount: z.number().positive().max(1_000_000_000).optional().nullable(),
    goal_currency: z.enum(CURRENCY_CODES).optional().nullable(),
    goal_deadline: z.string().optional().nullable(),
    is_primary: z.boolean().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/** Schema for POST /api/wallets/transfer — transfer between wallets */
export const walletTransferSchema = z
  .object({
    from_wallet_id: z.string().uuid('Invalid from_wallet_id format'),
    to_wallet_id: z.string().uuid('Invalid to_wallet_id format'),
    amount_btc: z
      .number({ required_error: 'amount_btc is required' })
      .positive('Amount must be positive')
      .max(21_000_000, 'Amount exceeds maximum BTC supply'),
    note: z.string().max(500, 'Note cannot exceed 500 characters').optional(),
  })
  .refine(data => data.from_wallet_id !== data.to_wallet_id, {
    message: 'Cannot transfer to the same wallet',
    path: ['to_wallet_id'],
  });

// ==================== PAYMENT SCHEMAS ====================

/**
 * Schema for POST /api/payments — initiate a payment.
 * Matches InitiatePaymentInput in domain/payments/types.ts.
 */
export const paymentCreateSchema = z.object({
  entity_type: z.enum(ENTITY_TYPES, {
    errorMap: () => ({ message: 'Invalid entity type' }),
  }),
  entity_id: z.string().uuid('entity_id must be a valid UUID'),
  /** Required for contributions; ignored for fixed-price entities */
  amount_btc: z
    .number()
    .positive('amount_btc must be positive')
    .optional(),
  /** Optional message for contributions */
  message: z.string().max(500, 'Message must be at most 500 characters').optional(),
  /** Whether contribution is anonymous */
  is_anonymous: z.boolean().optional().default(false),
  /** Shipping address for physical products */
  shipping_address_id: z.string().uuid('shipping_address_id must be a valid UUID').optional(),
  /** Optional buyer note */
  buyer_note: z.string().max(500, 'Buyer note must be at most 500 characters').optional(),
});

/**
 * Schema for POST /api/payments/[id] — action on a payment.
 */
export const paymentActionSchema = z.object({
  action: z.enum(['buyer_confirm'], {
    errorMap: () => ({ message: 'Invalid action. Supported: buyer_confirm' }),
  }),
});

// ==================== ENTITY-WALLET LINK SCHEMA ====================

/** Schema for POST /api/entity-wallets — link a wallet to an entity */
export const entityWalletLinkSchema = z.object({
  wallet_id: z.string().uuid('wallet_id must be a valid UUID'),
  entity_type: z.enum(ENTITY_TYPES, {
    errorMap: () => ({ message: `entity_type must be one of: ${ENTITY_TYPES.join(', ')}` }),
  }),
  entity_id: z.string().uuid('entity_id must be a valid UUID'),
});

// ==================== TRANSACTION SCHEMA ====================

/** Transaction validation (peer-to-peer value transfer) */
export const transactionSchema = z.object({
  amount_btc: z.number().positive().max(21_000_000),
  from_entity_type: z.enum(['profile', 'project']),
  from_entity_id: z.string().uuid(),
  to_entity_type: z.enum(['profile', 'project']),
  to_entity_id: z.string().uuid(),
  payment_method: z.enum(['bitcoin', 'lightning', 'on-chain', 'off-chain']),
  message: z.string().max(500).optional().nullable(),
  purpose: z.string().optional().nullable(),
  anonymous: z.boolean().default(false),
  public_visibility: z.boolean().default(true),
});

// Types
export type TransactionData = z.infer<typeof transactionSchema>;
export type PaymentCreateData = z.infer<typeof paymentCreateSchema>;
export type PaymentActionData = z.infer<typeof paymentActionSchema>;
export type EntityWalletLinkData = z.infer<typeof entityWalletLinkSchema>;
export type AssetFormData = z.infer<typeof assetSchema>;
export type LoanFormData = z.infer<typeof loanSchema>;
export type InvestmentFormData = z.infer<typeof investmentSchema>;
export type CollateralItemData = z.infer<typeof collateralItemSchema>;
export type WalletCreateData = z.infer<typeof walletCreateSchema>;
export type WalletUpdateData = z.infer<typeof walletUpdateSchema>;
export type WalletTransferData = z.infer<typeof walletTransferSchema>;
