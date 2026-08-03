/**
 * The inline advisory panel used across the money screens — "here is what we
 * know about what you just typed".
 *
 * One shape for all of them so that a warning always looks like a warning and a
 * confirmation always looks like a confirmation, no matter which screen raised
 * it. Tone is semantic (positive/warning), never decorative.
 */

const TONES = {
  neutral: 'border-default bg-surface-raised/40 text-fg-primary',
  positive: 'border-status-positive/40 bg-status-positive-subtle text-fg-primary',
  warning: 'border-status-warning/40 bg-status-warning-subtle text-fg-secondary',
} as const;

export type StatusNoteTone = keyof typeof TONES;

export function StatusNote({
  tone = 'neutral',
  children,
}: {
  tone?: StatusNoteTone;
  children: React.ReactNode;
}) {
  return <p className={`rounded-md border px-3 py-2 text-sm ${TONES[tone]}`}>{children}</p>;
}
