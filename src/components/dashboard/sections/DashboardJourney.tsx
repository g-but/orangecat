'use client';

import TasksSection from '@/components/dashboard/TasksSection';

/**
 * DashboardJourney - Recommended next steps for users
 *
 * DRY: All task/recommendation logic is in TasksSection (SSOT: useRecommendations hook)
 * This component is a thin wrapper that can be extended for journey-specific UI if needed.
 *
 * TasksSection handles:
 * - Profile completion tracking
 * - Task recommendations
 * - Celebration state when complete
 * - Loading/error states
 */
export function DashboardJourney() {
  return <TasksSection showQuestions={true} maxTasks={5} />;
}

export default DashboardJourney;
