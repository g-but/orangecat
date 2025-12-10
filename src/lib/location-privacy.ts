/**
 * Location privacy/group utilities
 *
 * We encode location privacy and grouping hints in `profile.location_context` to avoid schema changes.
 * Tokens:
 * - Hidden: "[HIDE]"
 * - Group:  "[GROUP]:<label>"
 */

export type LocationMode = 'actual' | 'hidden' | 'group';

const HIDE_TOKEN = '[HIDE]';
const GROUP_PREFIX = '[GROUP]:';

export function parseLocationContext(
  locationContext?: string | null
): { mode: LocationMode; groupLabel?: string } {
  const ctx = (locationContext || '').trim();
  if (!ctx) return { mode: 'actual' };

  if (ctx.includes(HIDE_TOKEN)) {
    return { mode: 'hidden' };
  }

  const idx = ctx.indexOf(GROUP_PREFIX);
  if (idx >= 0) {
    const label = ctx.substring(idx + GROUP_PREFIX.length).trim();
    if (label) return { mode: 'group', groupLabel: label };
  }

  return { mode: 'actual' };
}

export function buildLocationContext(
  baseContext: string | null | undefined,
  mode: LocationMode,
  groupLabel?: string
): string | undefined {
  // Remove prior tokens from base
  const base = (baseContext || '')
    .split('|')
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => s !== HIDE_TOKEN && !s.startsWith(GROUP_PREFIX));

  if (mode === 'hidden') {
    base.unshift(HIDE_TOKEN);
  } else if (mode === 'group' && groupLabel?.trim()) {
    base.unshift(`${GROUP_PREFIX}${groupLabel.trim()}`);
  }

  const result = base.join('|').trim();
  return result || undefined;
}

export function isLocationHidden(locationContext?: string | null): boolean {
  return parseLocationContext(locationContext).mode === 'hidden';
}

export function getLocationGroupLabel(locationContext?: string | null): string | undefined {
  const parsed = parseLocationContext(locationContext);
  return parsed.mode === 'group' ? parsed.groupLabel : undefined;
}

