/**
 * Proposal Templates
 *
 * Template definitions for proposal creation.
 * Provides quick-start templates for common proposal types.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Initial proposal templates
 */

import React from 'react';
import {
  DollarSign,
  Users,
  Shield,
  Briefcase,
  Lightbulb,
  Handshake,
  Building2,
  Target,
} from 'lucide-react';
import type { EntityTemplate } from '../types';

export interface ProposalTemplateData {
  title: string;
  description: string;
  proposal_type: 'general' | 'treasury' | 'membership' | 'governance' | 'employment';
  voting_threshold?: number;
  is_public?: boolean;
  amount_sats?: number;
  recipient_address?: string;
  action_type?: string;
  action_data?: Record<string, any>;
}

export const PROPOSAL_TEMPLATES: EntityTemplate<ProposalTemplateData>[] = [
  {
    id: 'spending-general',
    icon: React.createElement(DollarSign, { className: 'w-4 h-4' }),
    name: 'Spending Proposal',
    tagline: 'Allocate funds for a project or expense',
    defaults: {
      title: '',
      description: '',
      proposal_type: 'treasury',
      voting_threshold: 50,
      is_public: false,
      amount_sats: 0,
      recipient_address: '',
      action_type: 'spend_funds',
      action_data: {},
    },
  },
  {
    id: 'hire-developer',
    icon: React.createElement(Briefcase, { className: 'w-4 h-4' }),
    name: 'Hire Developer',
    tagline: 'Post a job opening for a developer position',
    defaults: {
      title: '',
      description: '',
      proposal_type: 'employment',
      voting_threshold: 50,
      is_public: true,
      action_type: undefined,
      action_data: {},
    },
  },
  {
    id: 'update-governance',
    icon: React.createElement(Shield, { className: 'w-4 h-4' }),
    name: 'Update Governance',
    tagline: 'Change voting thresholds or governance rules',
    defaults: {
      title: '',
      description: '',
      proposal_type: 'governance',
      voting_threshold: 60,
      is_public: false,
      action_type: undefined,
      action_data: {},
    },
  },
  {
    id: 'invite-member',
    icon: React.createElement(Users, { className: 'w-4 h-4' }),
    name: 'Invite New Member',
    tagline: 'Propose adding a new member to the group',
    defaults: {
      title: '',
      description: '',
      proposal_type: 'membership',
      voting_threshold: 50,
      is_public: false,
      action_type: undefined,
      action_data: {},
    },
  },
  {
    id: 'create-project',
    icon: React.createElement(Target, { className: 'w-4 h-4' }),
    name: 'Create Project',
    tagline: 'Propose creating a new group project',
    defaults: {
      title: '',
      description: '',
      proposal_type: 'general',
      voting_threshold: 50,
      is_public: false,
      action_type: 'create_project',
      action_data: {},
    },
  },
  {
    id: 'partnership',
    icon: React.createElement(Handshake, { className: 'w-4 h-4' }),
    name: 'Partnership Proposal',
    tagline: 'Propose a partnership or collaboration',
    defaults: {
      title: '',
      description: '',
      proposal_type: 'general',
      voting_threshold: 60,
      is_public: false,
      action_type: 'create_contract',
      action_data: {
        contract_type: 'partnership',
      },
    },
  },
  {
    id: 'fund-initiative',
    icon: React.createElement(Lightbulb, { className: 'w-4 h-4' }),
    name: 'Fund Initiative',
    tagline: 'Allocate funds for a community initiative',
    defaults: {
      title: '',
      description: '',
      proposal_type: 'treasury',
      voting_threshold: 50,
      is_public: false,
      amount_sats: 0,
      recipient_address: '',
      action_type: 'spend_funds',
      action_data: {},
    },
  },
  {
    id: 'create-contract',
    icon: React.createElement(Building2, { className: 'w-4 h-4' }),
    name: 'Create Contract',
    tagline: 'Propose creating a formal contract',
    defaults: {
      title: '',
      description: '',
      proposal_type: 'general',
      voting_threshold: 50,
      is_public: false,
      action_type: 'create_contract',
      action_data: {
        contract_type: 'service',
      },
    },
  },
];

