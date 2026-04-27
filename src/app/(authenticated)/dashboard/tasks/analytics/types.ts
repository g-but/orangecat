export interface ContributionData {
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  totalCompletions: number;
  totalMinutes: number;
  byCategory: Record<string, number>;
}

export interface FairnessData {
  task: {
    id: string;
    title: string;
    category: string;
    task_type: string;
  };
  totalCompletions: number;
  uniqueCompleterCount: number;
  completers: Array<{
    id: string;
    username: string;
    display_name: string | null;
    count: number;
  }>;
  fairnessScore: number;
  fairnessLevel: 'good' | 'moderate' | 'needs_attention';
}

export interface DashboardStats {
  total: number;
  pending: number;
  needsAttention: number;
  inProgress: number;
  completedToday: number;
  completedThisWeek: number;
  myCompletedToday: number;
  openRequests: number;
}
