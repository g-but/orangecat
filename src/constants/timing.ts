/**
 * TIMING — SSOT for all magic setTimeout/setInterval durations.
 * Mirrors the Z_INDEX pattern from src/constants/z-index.ts.
 * Use these constants instead of hardcoded millisecond values.
 */
export const TIMING = {
  /** Copy-confirm feedback, toast auto-dismiss */
  TOAST_DISMISS_MS: 2000,
  /** Search input debounce, location lookup debounce */
  DEBOUNCE_MS: 1000,
  /** Focus delays, dropdown open/close transitions */
  ANIMATION_SHORT_MS: 100,
  /** Menu animations (matches header.ts ANIMATION_DURATION and sidebar.ts) */
  ANIMATION_MEDIUM_MS: 300,
  /** fetch/request timeouts */
  API_TIMEOUT_MS: 20000,
  /** Offline queue retry delay */
  QUEUE_DELAY_MS: 5000,
  /** BTC rate refresh, analytics polling interval */
  POLLING_INTERVAL_MS: 30000,
} as const;
