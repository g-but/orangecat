/**
 * Index scoring helpers — recency decay and per-type quality signals that bias
 * ranking in match_content (score = similarity + 0.15 * quality_score).
 *
 * Split from reindexService.ts to keep it under the service size limit; these
 * are pure functions with no Supabase dependency, which is the natural seam.
 */

const DAY_MS = 86_400_000;

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** 1.0 today → 0.0 at 90 days. Absent timestamps score 0. */
export const recency = (ts: string | null | undefined): number => {
  if (!ts) {
    return 0;
  }
  const ageDays = (Date.now() - new Date(ts).getTime()) / DAY_MS;
  return clamp01(1 - ageDays / 90);
};

export const isVerified = (status: string | null | undefined): boolean =>
  status === 'verified' || status === 'approved';

export const profileQuality = (o: {
  lastActiveAt?: string | null;
  followers?: number;
  verified?: boolean;
}): number =>
  clamp01(
    0.5 * recency(o.lastActiveAt) +
      0.3 * Math.min((o.followers ?? 0) / 5, 1) +
      0.2 * (o.verified ? 1 : 0)
  );

export const causeQuality = (o: {
  updatedAt?: string | null;
  raised?: number;
  goal?: number;
}): number => {
  const funded = o.goal && o.goal > 0 ? clamp01((o.raised ?? 0) / o.goal) : 0;
  return clamp01(0.6 * recency(o.updatedAt) + 0.4 * funded);
};
