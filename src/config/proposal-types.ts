/**
 * Proposal Types Configuration (SSOT)
 *
 * Defines all proposal types and their behavior.
 * Adding a new type = adding entry here.
 */

export const PROPOSAL_TYPES = {
  general: {
    id: 'general',
    name: 'General',
    description: 'General group decisions',
    is_public: false,
    can_have_applications: false,
    default_voting_period_days: 7,
  },
  treasury: {
    id: 'treasury',
    name: 'Treasury',
    description: 'Spending group funds',
    is_public: false,
    can_have_applications: false,
    default_voting_period_days: 7,
    requires_treasury: true,
  },
  membership: {
    id: 'membership',
    name: 'Membership',
    description: 'Member management',
    is_public: false,
    can_have_applications: false,
    default_voting_period_days: 7,
  },
  governance: {
    id: 'governance',
    name: 'Governance',
    description: 'Change governance settings',
    is_public: false,
    can_have_applications: false,
    default_voting_period_days: 7,
    requires_founder: true,
  },
  employment: {
    id: 'employment',
    name: 'Employment',
    description: 'Hiring or employment decisions',
    is_public: true, // Can be public for job postings
    can_have_applications: true, // Can accept applications
    default_voting_period_days: 7,
  },
} as const;

export type ProposalType = keyof typeof PROPOSAL_TYPES;

export function getProposalTypeConfig(type: ProposalType) {
  return PROPOSAL_TYPES[type];
}

export function getAllProposalTypes() {
  return Object.values(PROPOSAL_TYPES);
}

