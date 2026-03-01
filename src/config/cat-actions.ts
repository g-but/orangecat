/**
 * My Cat Action Registry
 *
 * Defines all actions My Cat can execute on behalf of users.
 * Each action has permissions, parameters, and execution metadata.
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Initial implementation
 */

import {
  Package,
  Briefcase,
  Rocket,
  Heart,
  Calendar,
  MessageSquare,
  Send,
  Megaphone,
  Users,
  Wallet,
  Settings,
  FileText,
  Bell,
  type LucideIcon,
} from 'lucide-react';

// ==================== ACTION TYPES ====================

export type ActionCategory =
  | 'entities' // Create/manage products, services, projects, etc.
  | 'communication' // Timeline posts, messages
  | 'payments' // Bitcoin transactions
  | 'organization' // Group/org management
  | 'settings' // User settings
  | 'context'; // Managing My Cat's context

export type ActionRiskLevel = 'low' | 'medium' | 'high';

export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'entity_id' | 'user_id' | 'btc';
  required: boolean;
  description: string;
  default?: unknown;
}

export interface CatAction {
  id: string;
  name: string;
  description: string;
  category: ActionCategory;
  icon: LucideIcon;
  riskLevel: ActionRiskLevel;
  requiresConfirmation: boolean; // Always ask user before executing
  parameters: ActionParameter[];
  examples: string[]; // Example user requests that trigger this action
  apiEndpoint?: string; // If action calls an API
  enabled: boolean; // Can be disabled globally
}

// ==================== ACTION DEFINITIONS ====================

export const CAT_ACTIONS: Record<string, CatAction> = {
  // ---------- ENTITY ACTIONS ----------

  create_product: {
    id: 'create_product',
    name: 'Create Product',
    description: 'Create a new product listing for sale',
    category: 'entities',
    icon: Package,
    riskLevel: 'medium',
    requiresConfirmation: true,
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Product title' },
      { name: 'description', type: 'string', required: false, description: 'Product description' },
      { name: 'price_btc', type: 'btc', required: true, description: 'Price in BTC (e.g., 0.001)' },
      { name: 'category', type: 'string', required: false, description: 'Product category' },
      {
        name: 'publish',
        type: 'boolean',
        required: false,
        description: 'Publish immediately',
        default: false,
      },
    ],
    examples: [
      'Create a product for my ebook',
      'List my consulting package for sale',
      'Set up a product page for my artwork',
    ],
    apiEndpoint: '/api/products',
    enabled: true,
  },

  create_service: {
    id: 'create_service',
    name: 'Create Service',
    description: 'Create a new service offering',
    category: 'entities',
    icon: Briefcase,
    riskLevel: 'medium',
    requiresConfirmation: true,
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Service title' },
      { name: 'description', type: 'string', required: false, description: 'Service description' },
      {
        name: 'hourly_rate',
        type: 'btc',
        required: false,
        description: 'Hourly rate in BTC (e.g., 0.001)',
      },
      {
        name: 'fixed_price',
        type: 'btc',
        required: false,
        description: 'Fixed price in BTC (e.g., 0.005)',
      },
      {
        name: 'duration_minutes',
        type: 'number',
        required: false,
        description: 'Service duration',
      },
      {
        name: 'publish',
        type: 'boolean',
        required: false,
        description: 'Publish immediately',
        default: false,
      },
    ],
    examples: [
      'Create a consulting service',
      'Offer my design services',
      'Set up a coaching session service',
    ],
    apiEndpoint: '/api/services',
    enabled: true,
  },

  create_project: {
    id: 'create_project',
    name: 'Create Project',
    description: 'Create a crowdfunding project with a funding goal',
    category: 'entities',
    icon: Rocket,
    riskLevel: 'medium',
    requiresConfirmation: true,
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Project title' },
      { name: 'description', type: 'string', required: false, description: 'Project description' },
      {
        name: 'goal_btc',
        type: 'btc',
        required: true,
        description: 'Funding goal in BTC (e.g., 0.1)',
      },
      { name: 'category', type: 'string', required: false, description: 'Project category' },
      {
        name: 'publish',
        type: 'boolean',
        required: false,
        description: 'Publish immediately',
        default: false,
      },
    ],
    examples: [
      'Start a crowdfunding project',
      'Launch my network state project',
      'Create a funding campaign for my book',
    ],
    apiEndpoint: '/api/projects',
    enabled: true,
  },

  create_cause: {
    id: 'create_cause',
    name: 'Create Cause',
    description: 'Create an ongoing cause for supporters',
    category: 'entities',
    icon: Heart,
    riskLevel: 'medium',
    requiresConfirmation: true,
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Cause title' },
      { name: 'description', type: 'string', required: false, description: 'Cause description' },
      { name: 'category', type: 'string', required: false, description: 'Cause category' },
      {
        name: 'publish',
        type: 'boolean',
        required: false,
        description: 'Publish immediately',
        default: false,
      },
    ],
    examples: [
      'Create a cause for Bitcoin education',
      'Start a movement for digital sovereignty',
      'Set up ongoing support for my work',
    ],
    apiEndpoint: '/api/causes',
    enabled: true,
  },

  create_event: {
    id: 'create_event',
    name: 'Create Event',
    description: 'Create an event or meetup',
    category: 'entities',
    icon: Calendar,
    riskLevel: 'medium',
    requiresConfirmation: true,
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Event title' },
      { name: 'description', type: 'string', required: false, description: 'Event description' },
      { name: 'start_date', type: 'string', required: true, description: 'Event start date/time' },
      { name: 'location', type: 'string', required: true, description: 'Event location' },
      {
        name: 'publish',
        type: 'boolean',
        required: false,
        description: 'Publish immediately',
        default: false,
      },
    ],
    examples: [
      'Create a Bitcoin meetup',
      'Set up a conference event',
      'Organize a community gathering',
    ],
    apiEndpoint: '/api/events',
    enabled: true,
  },

  update_entity: {
    id: 'update_entity',
    name: 'Update Entity',
    description: 'Update an existing product, service, project, cause, or event',
    category: 'entities',
    icon: Settings,
    riskLevel: 'medium',
    requiresConfirmation: true,
    parameters: [
      { name: 'entity_type', type: 'string', required: true, description: 'Type of entity' },
      { name: 'entity_id', type: 'entity_id', required: true, description: 'Entity ID to update' },
      { name: 'updates', type: 'string', required: true, description: 'Fields to update (JSON)' },
    ],
    examples: [
      'Update my product price',
      'Change the description of my service',
      'Update the funding goal',
    ],
    enabled: true,
  },

  publish_entity: {
    id: 'publish_entity',
    name: 'Publish Entity',
    description: 'Make a draft entity live and visible',
    category: 'entities',
    icon: Megaphone,
    riskLevel: 'medium',
    requiresConfirmation: true,
    parameters: [
      { name: 'entity_type', type: 'string', required: true, description: 'Type of entity' },
      { name: 'entity_id', type: 'entity_id', required: true, description: 'Entity ID to publish' },
    ],
    examples: ['Publish my product', 'Make my project live', 'Launch my service'],
    enabled: true,
  },

  // ---------- COMMUNICATION ACTIONS ----------

  post_to_timeline: {
    id: 'post_to_timeline',
    name: 'Post to Timeline',
    description: 'Create a public post on your timeline',
    category: 'communication',
    icon: Megaphone,
    riskLevel: 'medium',
    requiresConfirmation: true,
    parameters: [
      { name: 'content', type: 'string', required: true, description: 'Post content' },
      {
        name: 'entity_id',
        type: 'entity_id',
        required: false,
        description: 'Entity to link/promote',
      },
    ],
    examples: [
      'Post about my new product',
      'Announce my project launch',
      'Share an update with my followers',
    ],
    apiEndpoint: '/api/posts',
    enabled: true,
  },

  send_message: {
    id: 'send_message',
    name: 'Send Message',
    description: 'Send a private message to another user',
    category: 'communication',
    icon: MessageSquare,
    riskLevel: 'high',
    requiresConfirmation: true,
    parameters: [
      { name: 'recipient_id', type: 'user_id', required: true, description: 'User to message' },
      { name: 'content', type: 'string', required: true, description: 'Message content' },
    ],
    examples: [
      'Message John about collaboration',
      'Send a thank you to my supporter',
      'Reach out to that Bitcoin developer',
    ],
    apiEndpoint: '/api/messages',
    enabled: true,
  },

  reply_to_message: {
    id: 'reply_to_message',
    name: 'Reply to Message',
    description: 'Reply to a message in an existing conversation',
    category: 'communication',
    icon: Send,
    riskLevel: 'medium',
    requiresConfirmation: true,
    parameters: [
      { name: 'conversation_id', type: 'string', required: true, description: 'Conversation ID' },
      { name: 'content', type: 'string', required: true, description: 'Reply content' },
    ],
    examples: ['Reply to that message', 'Respond to the inquiry', 'Answer their question'],
    enabled: true,
  },

  // ---------- PAYMENT ACTIONS ----------

  send_payment: {
    id: 'send_payment',
    name: 'Send Payment',
    description: 'Send Bitcoin to another user or lightning address',
    category: 'payments',
    icon: Wallet,
    riskLevel: 'high',
    requiresConfirmation: true,
    parameters: [
      {
        name: 'amount_btc',
        type: 'btc',
        required: true,
        description: 'Amount in BTC (e.g., 0.0001)',
      },
      {
        name: 'recipient',
        type: 'string',
        required: true,
        description: 'Username or lightning address',
      },
      { name: 'memo', type: 'string', required: false, description: 'Payment memo' },
    ],
    examples: [
      'Send 0.0001 BTC to @alice',
      'Pay for the service I ordered',
      'Tip a small amount to that creator',
    ],
    apiEndpoint: '/api/payments/send',
    enabled: true,
  },

  fund_project: {
    id: 'fund_project',
    name: 'Fund Project',
    description: 'Contribute Bitcoin to a project',
    category: 'payments',
    icon: Rocket,
    riskLevel: 'high',
    requiresConfirmation: true,
    parameters: [
      { name: 'project_id', type: 'entity_id', required: true, description: 'Project to fund' },
      {
        name: 'amount_btc',
        type: 'btc',
        required: true,
        description: 'Amount in BTC (e.g., 0.001)',
      },
      { name: 'message', type: 'string', required: false, description: 'Support message' },
    ],
    examples: [
      'Fund that network state project with 0.001 BTC',
      'Support the Bitcoin education project',
      'Contribute to their crowdfunding',
    ],
    enabled: true,
  },

  // ---------- ORGANIZATION ACTIONS ----------

  create_organization: {
    id: 'create_organization',
    name: 'Create Organization',
    description: 'Create a new organization or group',
    category: 'organization',
    icon: Users,
    riskLevel: 'medium',
    requiresConfirmation: true,
    parameters: [
      { name: 'name', type: 'string', required: true, description: 'Organization name' },
      { name: 'description', type: 'string', required: false, description: 'Description' },
      { name: 'type', type: 'string', required: false, description: 'Organization type' },
    ],
    examples: [
      'Create an organization for my project',
      'Set up a group for collaborators',
      'Start a company on OrangeCat',
    ],
    apiEndpoint: '/api/organizations',
    enabled: true,
  },

  invite_to_organization: {
    id: 'invite_to_organization',
    name: 'Invite to Organization',
    description: 'Invite a user to join your organization',
    category: 'organization',
    icon: Users,
    riskLevel: 'medium',
    requiresConfirmation: true,
    parameters: [
      {
        name: 'organization_id',
        type: 'entity_id',
        required: true,
        description: 'Organization ID',
      },
      { name: 'user_id', type: 'user_id', required: true, description: 'User to invite' },
      {
        name: 'role',
        type: 'string',
        required: false,
        description: 'Role in organization',
        default: 'member',
      },
    ],
    examples: [
      'Invite Alice to my organization',
      'Add Bob as an admin to the group',
      'Bring in that developer as a contributor',
    ],
    enabled: true,
  },

  // ---------- CONTEXT ACTIONS ----------

  add_context: {
    id: 'add_context',
    name: 'Add Context',
    description: 'Add new context document for My Cat to know about',
    category: 'context',
    icon: FileText,
    riskLevel: 'low',
    requiresConfirmation: false,
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Document title' },
      { name: 'content', type: 'string', required: true, description: 'Document content' },
      {
        name: 'document_type',
        type: 'string',
        required: false,
        description: 'Type of document',
        default: 'notes',
      },
    ],
    examples: [
      'Remember that I want to focus on Bitcoin education',
      'Add to my context that my budget is 1M sats',
      'Note that my goal is to launch by March',
    ],
    apiEndpoint: '/api/documents',
    enabled: true,
  },

  // ---------- NOTIFICATION ACTIONS ----------

  set_reminder: {
    id: 'set_reminder',
    name: 'Set Reminder',
    description: 'Set a reminder for yourself',
    category: 'context',
    icon: Bell,
    riskLevel: 'low',
    requiresConfirmation: false,
    parameters: [
      { name: 'message', type: 'string', required: true, description: 'Reminder message' },
      { name: 'when', type: 'string', required: true, description: 'When to remind' },
    ],
    examples: [
      'Remind me to check on my project tomorrow',
      'Set a reminder for the meeting next week',
      'Notify me when funding reaches 50%',
    ],
    enabled: false, // TODO: Implement reminder system
  },
};

// ==================== HELPERS ====================

export function getActionsByCategory(category: ActionCategory): CatAction[] {
  return Object.values(CAT_ACTIONS).filter(a => a.category === category && a.enabled);
}

export function getEnabledActions(): CatAction[] {
  return Object.values(CAT_ACTIONS).filter(a => a.enabled);
}

export function getHighRiskActions(): CatAction[] {
  return Object.values(CAT_ACTIONS).filter(a => a.riskLevel === 'high' && a.enabled);
}

export function getActionById(id: string): CatAction | undefined {
  return CAT_ACTIONS[id];
}

// Categories with metadata
export const ACTION_CATEGORIES: Record<ActionCategory, { name: string; description: string }> = {
  entities: {
    name: 'Entities',
    description: 'Create and manage products, services, projects, causes, and events',
  },
  communication: {
    name: 'Communication',
    description: 'Post to timeline and send messages',
  },
  payments: {
    name: 'Payments',
    description: 'Send Bitcoin and fund projects',
  },
  organization: {
    name: 'Organizations',
    description: 'Create and manage organizations',
  },
  settings: {
    name: 'Settings',
    description: 'Manage your account settings',
  },
  context: {
    name: 'Context',
    description: 'Manage what My Cat knows about you',
  },
};

// Export category keys as a tuple for Zod validation (DRY - single source of truth)
export const ACTION_CATEGORY_KEYS = Object.keys(ACTION_CATEGORIES) as [
  ActionCategory,
  ...ActionCategory[],
];

export default CAT_ACTIONS;
