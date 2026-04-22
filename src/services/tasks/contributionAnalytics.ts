/**
 * Task Contribution Analytics
 *
 * Pure computation for grouping task completions by contributor.
 */

interface CompletionRow {
  id: string;
  completed_by: string;
  completed_at: string;
  duration_minutes: number | null;
  task: { id: string; title: string; category: string } | null;
}

interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ContributorStats {
  user: ProfileRow;
  totalCompletions: number;
  totalMinutes: number;
  byCategory: Record<string, number>;
}

export function aggregateContributions(
  completions: CompletionRow[],
  profilesMap: Map<string, ProfileRow>,
  categoryFilter?: string
): ContributorStats[] {
  const filtered = categoryFilter ? completions.filter(c => c.task?.category === categoryFilter) : completions;
  const byUser = new Map<string, ContributorStats>();

  for (const c of filtered) {
    const profile = profilesMap.get(c.completed_by);
    if (!profile) continue;

    if (!byUser.has(c.completed_by)) {
      byUser.set(c.completed_by, { user: profile, totalCompletions: 0, totalMinutes: 0, byCategory: {} });
    }
    const stats = byUser.get(c.completed_by)!;
    stats.totalCompletions += 1;
    stats.totalMinutes += c.duration_minutes || 0;
    if (c.task?.category) {
      stats.byCategory[c.task.category] = (stats.byCategory[c.task.category] || 0) + 1;
    }
  }

  return Array.from(byUser.values()).sort((a, b) => b.totalCompletions - a.totalCompletions);
}
