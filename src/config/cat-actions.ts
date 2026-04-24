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
  Building2,
  TrendingUp,
  Coins,
  Gift,
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
    description: 'Create a community-funded project with a funding goal',
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
      'Start a funded project',
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

  create_asset: {
    id: 'create_asset',
    name: 'Create Asset',
    description: 'Register a rentable or sellable asset',
    category: 'entities',
    icon: Building2,
    riskLevel: 'medium',
    requiresConfirmation: true,
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Asset title' },
      { name: 'description', type: 'string', required: false, description: 'Asset description' },
      {
        name: 'asset_type',
        type: 'string',
        required: false,
        description: 'Type of asset (equipment, space, vehicle, etc.)',
      },
      { name: 'location', type: 'string', required: false, description: 'Asset location' },
      {
        name: 'publish',
        type: 'boolean',
        required: false,
        description: 'Publish immediately',
        default: false,
      },
    ],
    examples: [
      'Register my rental equipment',
      'List my co-working space',
      'Add my property as an asset',
    ],
    apiEndpoint: '/api/assets',
    enabled: true,
  },

  create_investment: {
    id: 'create_investment',
    name: 'Create Investment',
    description: 'Create a structured investment opportunity (equity, revenue-share, or debt)',
    category: 'entities',
    icon: TrendingUp,
    riskLevel: 'high',
    requiresConfirmation: true,
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Investment opportunity title' },
      { name: 'description', type: 'string', required: false, description: 'Investment description' },
      {
        name: 'investment_type',
        type: 'string',
        required: false,
        description: 'Type: revenue_share, equity, debt, convertible_note, token',
        default: 'revenue_share',
      },
      {
        name: 'target_amount_btc',
        type: 'btc',
        required: true,
        description: 'Funding target in BTC (e.g., 1.0)',
      },
      {
        name: 'minimum_investment_btc',
        type: 'btc',
        required: false,
        description: 'Minimum investment per investor in BTC (default: 0.0001)',
        default: 0.0001,
      },
      {
        name: 'publish',
        type: 'boolean',
        required: false,
        description: 'Open for investment immediately (status: open)',
        default: false,
      },
    ],
    examples: [
      'Create a revenue-share investment for my startup',
      'Set up an equity round for my project',
      'Launch a Bitcoin-denominated investment opportunity',
    ],
    apiEndpoint: '/api/investments',
    enabled: true,
  },

  create_loan: {
    id: 'create_loan',
    name: 'Create Loan Request',
    description: 'Create a peer-to-peer Bitcoin loan request',
    category: 'entities',
    icon: Coins,
    riskLevel: 'high',
    requiresConfirmation: true,
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Loan request title' },
      { name: 'description', type: 'string', required: false, description: 'Loan purpose and details' },
      {
        name: 'amount_btc',
        type: 'btc',
        required: true,
        description: 'Loan amount in BTC (e.g., 0.1)',
      },
      {
        name: 'interest_rate',
        type: 'number',
        required: false,
        description: 'Desired interest rate as a percentage (e.g., 5 for 5%)',
      },
      {
        name: 'loan_type',
        type: 'string',
        required: false,
        description: 'Type: new_request (default) or existing_refinance',
        default: 'new_request',
      },
    ],
    examples: [
      'Request a Bitcoin loan for my project',
      'Borrow 0.05 BTC for equipment at 5% interest',
      'Refinance my existing loan at a lower rate',
    ],
    apiEndpoint: '/api/loans',
    enabled: true,
  },

  create_research: {
    id: 'create_research',
    name: 'Create Research',
    description: 'Create a decentralized science (DeSci) research entity with Bitcoin funding',
    category: 'entities',
    icon: FileText,
    riskLevel: 'medium',
    requiresConfirmation: true,
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Research title' },
      { name: 'description', type: 'string', required: false, description: 'Research description and goals' },
      {
        name: 'field',
        type: 'string',
        required: false,
        description: 'Research field: biology, computer_science, mathematics, physics, economics, medicine, artificial_intelligence, blockchain_cryptography, other (default: other)',
        default: 'other',
      },
      {
        name: 'funding_goal_btc',
        type: 'btc',
        required: false,
        description: 'Funding goal in BTC (default: 0.001)',
        default: 0.001,
      },
      {
        name: 'methodology',
        type: 'string',
        required: false,
        description: 'Research methodology: experimental, theoretical, computational, empirical, mixed_methods (default: experimental)',
        default: 'experimental',
      },
      {
        name: 'lead_researcher',
        type: 'string',
        required: false,
        description: 'Lead researcher name (defaults to your username)',
        default: '',
      },
    ],
    examples: [
      'Start a DeSci research project on AI safety',
      'Create a Bitcoin-funded biology research entity',
      'Launch a decentralized science study on climate',
    ],
    apiEndpoint: '/api/research',
    enabled: true,
  },

  create_wishlist: {
    id: 'create_wishlist',
    name: 'Create Wishlist',
    description: 'Create a gift registry or wishlist others can fund',
    category: 'entities',
    icon: Gift,
    riskLevel: 'low',
    requiresConfirmation: false,
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Wishlist title (e.g., "My Birthday List")' },
      { name: 'description', type: 'string', required: false, description: 'Wishlist description' },
      {
        name: 'type',
        type: 'string',
        required: false,
        description: 'Wishlist type: general, birthday, wedding, baby_shower, graduation, personal (default: general)',
        default: 'general',
      },
      {
        name: 'visibility',
        type: 'string',
        required: false,
        description: 'Visibility: public, unlisted (link-only), private (default: public)',
        default: 'public',
      },
      {
        name: 'event_date',
        type: 'string',
        required: false,
        description: 'Optional event date (e.g., birthday or wedding date)',
      },
    ],
    examples: [
      'Create a birthday wishlist',
      'Set up a wedding registry',
      'Make a personal wishlist for my followers',
    ],
    apiEndpoint: '/api/wishlists',
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

  archive_entity: {
    id: 'archive_entity',
    name: 'Archive Entity',
    description: 'Archive (soft-delete) a product, service, project, cause, or event — sets status to archived and removes it from public view',
    category: 'entities',
    icon: Settings,
    riskLevel: 'high',
    requiresConfirmation: true,
    parameters: [
      { name: 'entity_type', type: 'string', required: true, description: 'Type of entity (product, service, project, cause, event, etc.)' },
      { name: 'entity_id', type: 'entity_id', required: true, description: 'Entity ID to archive' },
    ],
    examples: [
      'Delete my old product',
      'Remove that service from my profile',
      'Archive the project we cancelled',
    ],
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

  add_wallet: {
    id: 'add_wallet',
    name: 'Add Wallet',
    description: 'Create a savings goal wallet or budget wallet on the user\'s profile',
    category: 'payments',
    icon: Wallet,
    riskLevel: 'medium',
    requiresConfirmation: false,
    parameters: [
      { name: 'label', type: 'string', required: true, description: 'Wallet name (e.g. "Vacation Fund", "Food Budget")' },
      {
        name: 'behavior_type',
        type: 'string',
        required: true,
        description: '"one_time_goal" (save toward a target) | "recurring_budget" (periodic spending limit) | "general"',
      },
      { name: 'category', type: 'string', required: false, description: 'general | rent | food | medical | education | emergency | transportation | utilities | projects | legal | entertainment' },
      { name: 'description', type: 'string', required: false, description: 'What this wallet is for' },
      { name: 'goal_amount', type: 'number', required: false, description: 'Target amount in BTC (for one_time_goal)' },
      { name: 'goal_currency', type: 'string', required: false, description: 'Currency for the goal (e.g. BTC, CHF, USD)' },
      { name: 'goal_deadline', type: 'string', required: false, description: 'ISO date for the goal deadline (e.g. 2026-12-31)' },
      { name: 'budget_amount', type: 'number', required: false, description: 'Budget amount in BTC per period (for recurring_budget)' },
      { name: 'budget_period', type: 'string', required: false, description: 'daily | weekly | monthly | quarterly | yearly' },
      { name: 'lightning_address', type: 'string', required: false, description: 'Lightning address to associate (uses primary wallet\'s address if omitted)' },
    ],
    examples: [
      'Set up a vacation savings goal for 0.05 BTC by December',
      'Create a monthly food budget of 0.002 BTC',
      'Start an emergency fund',
      'I want to save for a new laptop — 0.1 BTC by end of year',
    ],
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
      'Contribute to their project',
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
      'Add to my context that my budget is 0.01 BTC',
      'Note that my goal is to launch by March',
    ],
    apiEndpoint: '/api/documents',
    enabled: true,
  },

  // ---------- PRODUCTIVITY ACTIONS ----------

  create_task: {
    id: 'create_task',
    name: 'Create Task',
    description: 'Create a task or to-do item',
    category: 'context',
    icon: FileText,
    riskLevel: 'low',
    requiresConfirmation: false,
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Task title' },
      { name: 'notes', type: 'string', required: false, description: 'Task notes / description' },
      {
        name: 'priority',
        type: 'string',
        required: false,
        description: 'Priority: low, normal, high, urgent (not medium — DB enum uses normal)',
        default: 'normal',
      },
      {
        name: 'due_date',
        type: 'string',
        required: false,
        description: 'Due date (ISO format)',
      },
    ],
    examples: [
      'Create a task to review my project proposal',
      'Add a high priority task to follow up with investors',
      'Remind me to update my service listing by Friday',
    ],
    apiEndpoint: '/api/tasks',
    enabled: true,
  },

  complete_task: {
    id: 'complete_task',
    name: 'Complete Task',
    description: 'Mark a task or reminder as completed',
    category: 'context',
    icon: Bell,
    riskLevel: 'low',
    requiresConfirmation: false,
    parameters: [
      {
        name: 'task_id',
        type: 'string',
        required: true,
        description: 'The task UUID from context (shown as [task_id: ...])',
      },
      {
        name: 'notes',
        type: 'string',
        required: false,
        description: 'Optional completion notes',
      },
    ],
    examples: [
      'Mark the call dentist reminder as done',
      'I finished the invoice task, mark it complete',
      'Done with that — check it off',
    ],
    apiEndpoint: '/api/tasks/:id/complete',
    enabled: true,
  },

  update_task: {
    id: 'update_task',
    name: 'Update Task',
    description: 'Update a task or reminder — reschedule, rename, or change priority',
    category: 'context',
    icon: Settings,
    riskLevel: 'low',
    requiresConfirmation: false,
    parameters: [
      {
        name: 'task_id',
        type: 'string',
        required: true,
        description: 'The task UUID from context (shown as [task_id: ...])',
      },
      {
        name: 'title',
        type: 'string',
        required: false,
        description: 'New title (omit to keep existing)',
      },
      {
        name: 'due_date',
        type: 'string',
        required: false,
        description: 'New due date — ISO 8601 or natural language ("next week", "in 2 hours")',
      },
      {
        name: 'notes',
        type: 'string',
        required: false,
        description: 'New notes/description (omit to keep existing)',
      },
      {
        name: 'priority',
        type: 'string',
        required: false,
        description: 'New priority: low, normal, high, urgent',
      },
    ],
    examples: [
      'Move that reminder to next Monday',
      'Reschedule the dentist reminder to next week',
      'Change the task title to something clearer',
      'Make that task high priority',
    ],
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
      { name: 'title', type: 'string', required: true, description: 'What to be reminded about' },
      { name: 'due_date', type: 'string', required: true, description: 'When — ISO 8601 or natural language ("tomorrow", "in 2 hours")' },
      { name: 'notes', type: 'string', required: false, description: 'Optional additional context' },
    ],
    examples: [
      'Remind me to check on my project tomorrow',
      'Set a reminder for the meeting next week',
      'Notify me when funding reaches 50%',
    ],
    enabled: true,
  },

  // ---------- PROFILE ACTIONS ----------

  update_profile: {
    id: 'update_profile',
    name: 'Update Profile',
    description: 'Update the user\'s public profile — name, bio, background, location, or website',
    category: 'context',
    icon: Settings,
    riskLevel: 'medium',
    requiresConfirmation: false,
    parameters: [
      { name: 'name', type: 'string', required: false, description: 'Display name' },
      { name: 'bio', type: 'string', required: false, description: 'Short bio (appears on profile)' },
      { name: 'background', type: 'string', required: false, description: 'Longer background / about section' },
      { name: 'website', type: 'string', required: false, description: 'Personal or business website URL' },
      { name: 'location_city', type: 'string', required: false, description: 'City' },
      { name: 'location_country', type: 'string', required: false, description: 'Country (ISO 2-letter code, e.g. CH, US, DE)' },
    ],
    examples: [
      'Update my bio to say I\'m a freelance photographer',
      'Set my location to Zurich, Switzerland',
      'My website is example.com, add it to my profile',
      'Write a background section based on what I\'ve told you',
    ],
    enabled: true,
  },
};

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
