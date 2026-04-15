/**
 * API_ROUTES — SSOT for all internal API endpoint paths.
 * Mirrors the ROUTES pattern from src/config/routes.ts (which covers frontend paths).
 * Use these constants in fetch() calls instead of hardcoded strings.
 */
export const API_ROUTES = {
  CAT: {
    CHAT: '/api/cat/chat',
    SUGGESTIONS: '/api/cat/suggestions',
    HISTORY: '/api/cat/history',
    CONTEXT: '/api/cat/context',
    PERMISSIONS: '/api/cat/permissions',
    ACTIONS: '/api/cat/actions',
  },
  MESSAGES: {
    BASE: '/api/messages',
    ACTORS: '/api/messages/actors',
    BULK_CONVERSATIONS: '/api/messages/bulk-conversations',
    BULK_DELETE: '/api/messages/bulk-delete',
    UNREAD_COUNT: '/api/messages/unread-count',
  },
  WALLETS: {
    BASE: '/api/wallets',
    TRANSFER: '/api/wallets/transfer',
  },
  ENTITY_WALLETS: '/api/entity-wallets',
  CURRENCY: {
    RATES: '/api/currency/rates',
  },
  NOTIFICATIONS: {
    UNREAD: '/api/notifications/unread',
    READ: '/api/notifications/read',
    PREFERENCES: '/api/notifications/preferences',
  },
  SOCIAL: {
    FOLLOW: '/api/social/follow',
    UNFOLLOW: '/api/social/unfollow',
  },
  TASKS: {
    BASE: '/api/tasks',
    ANALYTICS: '/api/task-analytics',
  },
  AI_CREDITS: {
    BASE: '/api/ai-credits',
    ADD: '/api/ai-credits/add',
    REVENUE: '/api/ai-credits/revenue',
    WITHDRAWALS: '/api/ai-credits/withdrawals',
  },
  AI: {
    FORM_PREFILL: '/api/ai/form-prefill',
    PLATFORM_USAGE: '/api/ai/platform-usage',
  },
  AUTH: {
    CALLBACK: '/api/auth/callback',
    SYNC: '/api/auth/sync',
    VERIFY_CAPTCHA: '/api/auth/verify-captcha',
  },
  DOCUMENTS: {
    BASE: '/api/documents',
    EXTRACT: '/api/documents/extract',
  },
  WISHLISTS: {
    BASE: '/api/wishlists',
    PROOFS: '/api/wishlists/proofs',
    FEEDBACK: '/api/wishlists/feedback',
  },
  USER: {
    API_KEYS: '/api/user/api-keys',
    API_KEYS_VALIDATE: '/api/user/api-keys/validate',
    STATS: '/api/users/me/stats',
  },
  PAYMENTS: {
    BASE: '/api/payments',
    SEND: '/api/payments/send',
  },
  ONBOARDING: {
    ANALYZE: '/api/onboarding/analyze',
  },
  PROJECTS: {
    BASE: '/api/projects',
    FAVORITES: '/api/projects/favorites',
  },
  LOANS: {
    BASE: '/api/loans',
    COLLATERAL: '/api/loan-collateral',
  },
  PROFILE: '/api/profile',
  CHAT: '/api/chat',
  GROUPS: '/api/groups',
  JOBS: '/api/jobs',
  SHIPPING_ADDRESSES: '/api/shipping-addresses',
  DELETE_USER: '/api/delete-user',
  WAITLIST: '/api/waitlist',
  AI_ASSISTANTS: '/api/ai-assistants',
  TRANSACTIONS: '/api/transactions',
  PRESENCE: {
    OFFLINE: '/api/presence/offline',
  },
} as const;
