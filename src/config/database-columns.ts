/**
 * Database Column Constants - Single Source of Truth
 *
 * ALL column names must come from here.
 * Never hardcode column names in code.
 *
 * Benefits:
 * - Safe refactoring (rename column in one place)
 * - Autocomplete support
 * - Prevents typos
 * - Type safety
 * - Easy to find all usages
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Initial column constants registry
 */

/**
 * Column names for all database tables
 * 
 * Usage:
 * ```typescript
 * import { COLUMNS } from '@/config/database-columns';
 * 
 * // ✅ GOOD - Type-safe, autocomplete works
 * .eq(COLUMNS.profiles.ID, userId)
 * .select(COLUMNS.profiles.NAME, COLUMNS.profiles.EMAIL)
 * 
 * // ❌ BAD - Hardcoded, no type safety
 * .eq('id', userId)
 * .select('name', 'email')
 * ```
 */
export const COLUMNS = {
  profiles: {
    ID: 'id',
    USERNAME: 'username',
    NAME: 'name', // ✅ Use this, not 'display_name'
    EMAIL: 'email',
    BIO: 'bio',
    AVATAR_URL: 'avatar_url',
    BANNER_URL: 'banner_url',
    COVER_IMAGE_URL: 'cover_image_url',
    WEBSITE: 'website',
    BITCOIN_ADDRESS: 'bitcoin_address',
    LIGHTNING_ADDRESS: 'lightning_address',
    BITCOIN_PUBLIC_KEY: 'bitcoin_public_key',
    LIGHTNING_NODE_ID: 'lightning_node_id',
    BITCOIN_BALANCE: 'bitcoin_balance',
    LIGHTNING_BALANCE: 'lightning_balance',
    PAYMENT_PREFERENCES: 'payment_preferences',
    PHONE: 'phone',
    LOCATION: 'location',
    LOCATION_SEARCH: 'location_search',
    LOCATION_COUNTRY: 'location_country',
    LOCATION_CITY: 'location_city',
    LOCATION_ZIP: 'location_zip',
    LATITUDE: 'latitude',
    LONGITUDE: 'longitude',
    TIMEZONE: 'timezone',
    LANGUAGE: 'language',
    CURRENCY: 'currency',
    FOLLOWER_COUNT: 'follower_count',
    FOLLOWING_COUNT: 'following_count',
    CAMPAIGN_COUNT: 'campaign_count',
    PROFILE_VIEWS: 'profile_views',
    TOTAL_RAISED: 'total_raised',
    TOTAL_DONATED: 'total_donated',
    VERIFICATION_STATUS: 'verification_status',
    VERIFICATION_LEVEL: 'verification_level',
    VERIFICATION_DATA: 'verification_data',
    KYC_STATUS: 'kyc_status',
    STATUS: 'status',
    LAST_ACTIVE_AT: 'last_active_at',
    LAST_LOGIN_AT: 'last_login_at',
    LOGIN_COUNT: 'login_count',
    PROFILE_COMPLETED_AT: 'profile_completed_at',
    ONBOARDING_COMPLETED: 'onboarding_completed',
    TERMS_ACCEPTED_AT: 'terms_accepted_at',
    PRIVACY_POLICY_ACCEPTED_AT: 'privacy_policy_accepted_at',
    TWO_FACTOR_ENABLED: 'two_factor_enabled',
    SOCIAL_LINKS: 'social_links',
    PREFERENCES: 'preferences',
    PRIVACY_SETTINGS: 'privacy_settings',
    METADATA: 'metadata',
    THEME_PREFERENCES: 'theme_preferences',
    PROFILE_COLOR: 'profile_color',
    PROFILE_BADGES: 'profile_badges',
    CUSTOM_CSS: 'custom_css',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
  },
  projects: {
    ID: 'id',
    USER_ID: 'user_id',
    ACTOR_ID: 'actor_id',
    GROUP_ID: 'group_id',
    TITLE: 'title',
    DESCRIPTION: 'description',
    CATEGORY: 'category',
    TAGS: 'tags',
    COVER_IMAGE_URL: 'cover_image_url',
    WEBSITE_URL: 'website_url',
    FUNDING_PURPOSE: 'funding_purpose',
    GOAL_AMOUNT: 'goal_amount',
    RAISED_AMOUNT: 'raised_amount',
    CONTRIBUTOR_COUNT: 'contributor_count',
    CURRENCY: 'currency',
    BITCOIN_ADDRESS: 'bitcoin_address',
    LIGHTNING_ADDRESS: 'lightning_address',
    BITCOIN_BALANCE_BTC: 'bitcoin_balance_btc',
    BITCOIN_BALANCE_UPDATED_AT: 'bitcoin_balance_updated_at',
    STATUS: 'status',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
  },
  user_products: {
    ID: 'id',
    USER_ID: 'user_id',
    ACTOR_ID: 'actor_id',
    GROUP_ID: 'group_id',
    TITLE: 'title',
    DESCRIPTION: 'description',
    PRICE_SATS: 'price_sats',
    CURRENCY: 'currency',
    PRODUCT_TYPE: 'product_type',
    IMAGES: 'images',
    THUMBNAIL_URL: 'thumbnail_url',
    INVENTORY_COUNT: 'inventory_count',
    FULFILLMENT_TYPE: 'fulfillment_type',
    CATEGORY: 'category',
    TAGS: 'tags',
    STATUS: 'status',
    IS_FEATURED: 'is_featured',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
  },
  user_services: {
    ID: 'id',
    USER_ID: 'user_id',
    ACTOR_ID: 'actor_id',
    GROUP_ID: 'group_id',
    TITLE: 'title',
    DESCRIPTION: 'description',
    CATEGORY: 'category',
    HOURLY_RATE_SATS: 'hourly_rate_sats',
    FIXED_PRICE_SATS: 'fixed_price_sats',
    CURRENCY: 'currency',
    DURATION_MINUTES: 'duration_minutes',
    AVAILABILITY_SCHEDULE: 'availability_schedule',
    SERVICE_LOCATION_TYPE: 'service_location_type',
    SERVICE_AREA: 'service_area',
    IMAGES: 'images',
    PORTFOLIO_LINKS: 'portfolio_links',
    STATUS: 'status',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
  },
  user_causes: {
    ID: 'id',
    USER_ID: 'user_id',
    ACTOR_ID: 'actor_id',
    GROUP_ID: 'group_id',
    TITLE: 'title',
    DESCRIPTION: 'description',
    CAUSE_CATEGORY: 'cause_category',
    GOAL_SATS: 'goal_sats',
    CURRENCY: 'currency',
    BITCOIN_ADDRESS: 'bitcoin_address',
    LIGHTNING_ADDRESS: 'lightning_address',
    DISTRIBUTION_RULES: 'distribution_rules',
    BENEFICIARIES: 'beneficiaries',
    STATUS: 'status',
    TOTAL_RAISED_SATS: 'total_raised_sats',
    TOTAL_DISTRIBUTED_SATS: 'total_distributed_sats',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
  },
  loans: {
    ID: 'id',
    USER_ID: 'user_id',
    ACTOR_ID: 'actor_id',
    TITLE: 'title',
    DESCRIPTION: 'description',
    AMOUNT_SATS: 'amount_sats',
    CURRENCY: 'currency',
    PURPOSE: 'purpose',
    COLLATERAL: 'collateral',
    REPAYMENT_TERMS: 'repayment_terms',
    STATUS: 'status',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
  },
  groups: {
    ID: 'id',
    NAME: 'name',
    SLUG: 'slug',
    DESCRIPTION: 'description',
    LABEL: 'label',
    TAGS: 'tags',
    AVATAR_URL: 'avatar_url',
    BANNER_URL: 'banner_url',
    IS_PUBLIC: 'is_public',
    VISIBILITY: 'visibility',
    BITCOIN_ADDRESS: 'bitcoin_address',
    LIGHTNING_ADDRESS: 'lightning_address',
    GOVERNANCE_PRESET: 'governance_preset',
    VOTING_THRESHOLD: 'voting_threshold',
    CREATED_BY: 'created_by',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
  },
  group_members: {
    ID: 'id',
    GROUP_ID: 'group_id',
    USER_ID: 'user_id',
    ROLE: 'role',
    PERMISSION_OVERRIDES: 'permission_overrides',
    INVITED_BY: 'invited_by',
    JOINED_AT: 'joined_at',
  },
  group_proposals: {
    ID: 'id',
    GROUP_ID: 'group_id',
    PROPOSER_ID: 'proposer_id',
    TITLE: 'title',
    DESCRIPTION: 'description',
    PROPOSAL_TYPE: 'proposal_type',
    STATUS: 'status',
    VOTING_THRESHOLD: 'voting_threshold',
    ACTION_TYPE: 'action_type',
    ACTION_DATA: 'action_data',
    VOTING_STARTS_AT: 'voting_starts_at',
    VOTING_ENDS_AT: 'voting_ends_at',
    EXECUTED_AT: 'executed_at',
    IS_PUBLIC: 'is_public',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
  },
  group_votes: {
    ID: 'id',
    PROPOSAL_ID: 'proposal_id',
    VOTER_ID: 'voter_id',
    VOTE: 'vote',
    VOTING_POWER: 'voting_power',
    VOTED_AT: 'voted_at',
  },
  group_wallets: {
    ID: 'id',
    GROUP_ID: 'group_id',
    NAME: 'name',
    DESCRIPTION: 'description',
    PURPOSE: 'purpose',
    BITCOIN_ADDRESS: 'bitcoin_address',
    LIGHTNING_ADDRESS: 'lightning_address',
    CURRENT_BALANCE_SATS: 'current_balance_sats',
    IS_ACTIVE: 'is_active',
    CREATED_BY: 'created_by',
    REQUIRED_SIGNATURES: 'required_signatures',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
  },
  conversations: {
    ID: 'id',
    CONVERSATION_TYPE: 'conversation_type',
    IS_GROUP: 'is_group',
    TITLE: 'title',
    DESCRIPTION: 'description',
    CREATED_BY: 'created_by',
    LAST_MESSAGE_AT: 'last_message_at',
    LAST_MESSAGE_PREVIEW: 'last_message_preview',
    LAST_MESSAGE_SENDER_ID: 'last_message_sender_id',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
  },
  messages: {
    ID: 'id',
    CONVERSATION_ID: 'conversation_id',
    SENDER_ID: 'sender_id',
    CONTENT: 'content',
    MESSAGE_TYPE: 'message_type',
    METADATA: 'metadata',
    IS_DELETED: 'is_deleted',
    EDITED_AT: 'edited_at',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
  },
  transactions: {
    ID: 'id',
    FROM_USER_ID: 'from_user_id',
    TO_USER_ID: 'to_user_id',
    TO_PROJECT_ID: 'to_project_id',
    AMOUNT_SATS: 'amount_sats',
    CURRENCY: 'currency',
    TRANSACTION_TYPE: 'transaction_type',
    STATUS: 'status',
    TRANSACTION_HASH: 'transaction_hash',
    LIGHTNING_INVOICE: 'lightning_invoice',
    METADATA: 'metadata',
    CREATED_AT: 'created_at',
  },
  actors: {
    ID: 'id',
    ACTOR_TYPE: 'actor_type',
    USER_ID: 'user_id',
    GROUP_ID: 'group_id',
    DISPLAY_NAME: 'display_name',
    AVATAR_URL: 'avatar_url',
    SLUG: 'slug',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
  },
} as const;

/**
 * Type-safe column accessor
 * 
 * Usage:
 * ```typescript
 * const columnName = column('profiles', 'NAME'); // Returns 'name'
 * ```
 */
export function column<T extends keyof typeof COLUMNS>(
  table: T,
  col: keyof typeof COLUMNS[T]
): string {
  return COLUMNS[table][col] as string;
}

/**
 * Get all column names for a table
 * 
 * Usage:
 * ```typescript
 * const profileColumns = getColumns('profiles');
 * // Returns: ['id', 'username', 'name', 'email', ...]
 * ```
 */
export function getColumns<T extends keyof typeof COLUMNS>(
  table: T
): string[] {
  return Object.values(COLUMNS[table]) as string[];
}
