/**
 * Task Fairness Analytics
 *
 * Pure computation functions for task fairness metrics.
 * No DB calls — all data is passed in.
 */

interface TaskRow {
  id: string;
  title: string;
  category: string;
  task_type: string;
}

interface CompletionRow {
  id: string;
  task_id: string;
  completed_by: string;
  completed_at: string;
}

interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
}

export interface TaskFairnessMetric {
  task: { id: string; title: string; category: string; task_type: string };
  totalCompletions: number;
  uniqueCompleterCount: number;
  completers: Array<{ id: string; username: string; display_name: string | null; count: number }>;
  fairnessScore: number;
  fairnessLevel: 'good' | 'moderate' | 'needs_attention';
}

export function computeFairnessMetrics(
  recurringTasks: TaskRow[],
  completions: CompletionRow[],
  profilesMap: Map<string, ProfileRow>
): TaskFairnessMetric[] {
  const taskMetrics = recurringTasks.map(task => {
    const taskCompletions = completions.filter(c => c.task_id === task.id);

    const uniqueCompleters = new Map<
      string,
      { id: string; username: string; display_name: string | null; count: number }
    >();

    for (const completion of taskCompletions) {
      const profile = profilesMap.get(completion.completed_by);
      if (!profile) continue;
      const existing = uniqueCompleters.get(profile.id);
      if (existing) {
        existing.count += 1;
      } else {
        uniqueCompleters.set(profile.id, {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          count: 1,
        });
      }
    }

    const completersArray = Array.from(uniqueCompleters.values()).sort((a, b) => b.count - a.count);

    let fairnessScore = 100;
    if (completersArray.length > 1 && taskCompletions.length > 0) {
      const avgCount = taskCompletions.length / completersArray.length;
      const variance =
        completersArray.reduce((sum, c) => sum + Math.pow(c.count - avgCount, 2), 0) /
        completersArray.length;
      const stdDev = Math.sqrt(variance);
      fairnessScore = Math.round(Math.max(0, 100 - (stdDev / avgCount) * 50));
    } else if (completersArray.length === 1 && taskCompletions.length > 3) {
      fairnessScore = 25;
    } else if (taskCompletions.length === 0) {
      fairnessScore = 50;
    }

    const fairnessLevel: 'good' | 'moderate' | 'needs_attention' =
      fairnessScore >= 80 ? 'good' : fairnessScore >= 50 ? 'moderate' : 'needs_attention';

    return {
      task: { id: task.id, title: task.title, category: task.category, task_type: task.task_type },
      totalCompletions: taskCompletions.length,
      uniqueCompleterCount: uniqueCompleters.size,
      completers: completersArray,
      fairnessScore,
      fairnessLevel,
    };
  });

  return taskMetrics.sort((a, b) => a.fairnessScore - b.fairnessScore);
}
