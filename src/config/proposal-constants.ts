/**
 * Proposal Constants
 *
 * Single source of truth for proposal statuses, types, and related constants.
 * Follows SSOT principle to avoid magic strings and duplication.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Initial proposal constants
 */

export const PROPOSAL_STATUSES = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PASSED: 'passed',
  FAILED: 'failed',
  EXECUTED: 'executed',
  CANCELLED: 'cancelled',
} as const;

export type ProposalStatus = typeof PROPOSAL_STATUSES[keyof typeof PROPOSAL_STATUSES];

export const PROPOSAL_TYPES = {
  GENERAL: 'general',
  TREASURY: 'treasury',
  MEMBERSHIP: 'membership',
  GOVERNANCE: 'governance',
  EMPLOYMENT: 'employment',
} as const;

export type ProposalType = typeof PROPOSAL_TYPES[keyof typeof PROPOSAL_TYPES];

export const PROPOSAL_TYPE_LABELS: Record<ProposalType, string> = {
  [PROPOSAL_TYPES.GENERAL]: 'General',
  [PROPOSAL_TYPES.TREASURY]: 'Treasury',
  [PROPOSAL_TYPES.MEMBERSHIP]: 'Membership',
  [PROPOSAL_TYPES.GOVERNANCE]: 'Governance',
  [PROPOSAL_TYPES.EMPLOYMENT]: 'Employment',
};

export const PROPOSAL_STATUS_CONFIG: Record<
  ProposalStatus,
  { label: string; badgeVariant: 'default' | 'outline' | 'secondary'; className: string }
> = {
  [PROPOSAL_STATUSES.DRAFT]: {
    label: 'Draft',
    badgeVariant: 'outline',
    className: '',
  },
  [PROPOSAL_STATUSES.ACTIVE]: {
    label: 'Active',
    badgeVariant: 'default',
    className: 'bg-blue-500',
  },
  [PROPOSAL_STATUSES.PASSED]: {
    label: 'Passed',
    badgeVariant: 'default',
    className: 'bg-green-500',
  },
  [PROPOSAL_STATUSES.FAILED]: {
    label: 'Failed',
    badgeVariant: 'default',
    className: 'bg-red-500',
  },
  [PROPOSAL_STATUSES.EXECUTED]: {
    label: 'Executed',
    badgeVariant: 'default',
    className: 'bg-purple-500',
  },
  [PROPOSAL_STATUSES.CANCELLED]: {
    label: 'Cancelled',
    badgeVariant: 'secondary',
    className: '',
  },
};

