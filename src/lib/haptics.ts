/**
 * Haptic feedback — SSOT for the buzz patterns.
 *
 * Every money app worth copying confirms a payment in more than one channel:
 * you see the check AND you feel it. That redundancy matters most exactly where
 * we need it — a phone held at arm's length in a shop, screen half-glanced at.
 *
 * Deliberately conservative:
 *  - only fires for events the user caused and would want confirmed;
 *  - respects `prefers-reduced-motion`, which is the closest thing the platform
 *    gives us to "this person doesn't want to be buzzed at";
 *  - a no-op everywhere it isn't supported (all of iOS Safari, most desktops),
 *    so callers never have to guard.
 *
 * Patterns are in milliseconds; arrays alternate vibrate/pause.
 */

const PATTERNS = {
  /** A payment landed. Two short pulses — distinct from a notification buzz. */
  success: [12, 60, 24],
  /** Something the user tried to do did not happen. One longer pulse. */
  error: [60],
  /** Light acknowledgement of a discrete choice (tab, amount preset). */
  tap: [8],
} as const;

export type HapticPattern = keyof typeof PATTERNS;

function reducedMotionPreferred(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function haptic(pattern: HapticPattern): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }
  if (reducedMotionPreferred()) {
    return;
  }
  try {
    navigator.vibrate(PATTERNS[pattern] as unknown as number[]);
  } catch {
    // Some browsers throw when the document isn't focused. Never worth surfacing.
  }
}
