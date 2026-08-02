import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BarChart3, Activity, TrendingUp, Target, Users } from 'lucide-react';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { ROUTES } from '@/config/routes';
import type { Project } from '@/stores/projectStore';

interface AnalyticsInsightsProps {
  projects: Project[];
}

function deriveInsights(projects: Project[]) {
  if (projects.length === 0) {
    return [];
  }

  const insights: { icon: React.ElementType; title: string; body: string; color: string }[] = [];

  const bestProject = projects.reduce((best, p) =>
    (p.total_funding || 0) > (best.total_funding || 0) ? p : best
  );

  if (bestProject.total_funding > 0) {
    insights.push({
      icon: TrendingUp,
      title: 'Top-performing project',
      body: `"${bestProject.title}" has raised the most across your selected projects.`,
      color: 'tiffany',
    });
  }

  const goalsReached = projects.filter(
    p => p.goal_amount && (p.total_funding || 0) >= p.goal_amount
  );
  const successRate = Math.round((goalsReached.length / projects.length) * 100);
  insights.push({
    icon: Target,
    title: `${successRate}% goal completion rate`,
    body:
      goalsReached.length === projects.length
        ? 'All selected projects have reached their funding goal.'
        : `${goalsReached.length} of ${projects.length} selected projects reached their goal.`,
    color: 'green',
  });

  const totalSupporters = projects.reduce((sum, p) => sum + (p.contributor_count || 0), 0);
  const avgSupporters = projects.length > 0 ? Math.round(totalSupporters / projects.length) : 0;
  if (avgSupporters > 0) {
    insights.push({
      icon: Users,
      title: `${avgSupporters} average supporters per project`,
      body: `Across your selected ${projects.length} project${projects.length !== 1 ? 's' : ''}, you average ${avgSupporters} supporter${avgSupporters !== 1 ? 's' : ''} each.`,
      color: 'orange',
    });
  }

  return insights;
}

const COLOR_CLASSES: Record<
  string,
  { bg: string; border: string; title: string; body: string; icon: string }
> = {
  tiffany: {
    bg: 'bg-surface-raised/40',
    border: 'border-subtle',
    title: 'text-fg-primary',
    body: 'text-fg-primary',
    icon: 'text-fg-primary',
  },
  green: {
    bg: 'bg-status-positive-subtle',
    border: 'border-subtle',
    title: 'text-status-positive',
    body: 'text-status-positive',
    icon: 'text-status-positive',
  },
  orange: {
    bg: 'bg-surface-raised/40',
    border: 'border-subtle',
    title: 'text-fg-primary',
    body: 'text-fg-primary',
    icon: 'text-fg-primary',
  },
};

// Chart palette — cycles through brand colors per project
const CHART_COLORS = [
  { bar: '#089B96', label: 'tiffany' },
  { bar: '#FF6B00', label: 'orange' },
  { bar: '#3b82f6', label: 'blue' },
  { bar: '#8b5cf6', label: 'purple' },
  { bar: '#ec4899', label: 'pink' },
];

function FundingProgressChart({ projects }: { projects: Project[] }) {
  const { formatAmountBtc } = useDisplayCurrency();
  const projectsWithGoal = projects.filter(p => p.goal_amount && p.goal_amount > 0);

  if (projectsWithGoal.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center text-fg-secondary">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No projects with goals yet</p>
          <p className="text-xs mt-1">Set a funding goal on your projects to see progress</p>
        </div>
      </div>
    );
  }

  // Show up to 6 projects
  const displayProjects = projectsWithGoal.slice(0, 6);

  return (
    <div className="space-y-3 py-2">
      {displayProjects.map((project, i) => {
        const goal = project.goal_amount!;
        const raised = project.total_funding || 0;
        const pct = Math.min((raised / goal) * 100, 100);
        const color = CHART_COLORS[i % CHART_COLORS.length];
        const reached = raised >= goal;

        return (
          <div key={project.id}>
            <div className="flex justify-between items-center mb-1">
              <span
                className="text-sm font-medium text-fg-primary truncate max-w-[60%]"
                title={project.title}
              >
                {project.title}
              </span>
              <span className="text-xs text-fg-secondary ml-2 shrink-0">
                {pct.toFixed(0)}% of goal
              </span>
            </div>
            <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: reached ? '#22c55e' : color.bar,
                }}
              />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-xs text-fg-secondary">{formatAmountBtc(raised)} raised</span>
              <span className="text-xs text-fg-secondary">{formatAmountBtc(goal)} goal</span>
            </div>
          </div>
        );
      })}
      {projectsWithGoal.length > 6 && (
        <p className="text-xs text-fg-secondary text-center pt-1">
          +{projectsWithGoal.length - 6} more projects
        </p>
      )}
    </div>
  );
}

function SupporterDistributionChart({ projects }: { projects: Project[] }) {
  const withSupporters = projects.filter(p => (p.contributor_count || 0) > 0);
  const total = withSupporters.reduce((s, p) => s + (p.contributor_count || 0), 0);

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center text-fg-secondary">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No supporters yet</p>
          <p className="text-xs mt-1">Supporters will appear here once you receive funding</p>
        </div>
      </div>
    );
  }

  const displayProjects = withSupporters.slice(0, 6);

  return (
    <div className="space-y-2 py-2">
      {/* Stacked bar */}
      <div className="flex h-6 rounded-full overflow-hidden mb-4">
        {displayProjects.map((project, i) => {
          const pct = ((project.contributor_count || 0) / total) * 100;
          const color = CHART_COLORS[i % CHART_COLORS.length];
          return (
            <div
              key={project.id}
              style={{ width: `${pct}%`, backgroundColor: color.bar }}
              title={`${project.title}: ${project.contributor_count} supporters`}
            />
          );
        })}
        {withSupporters.length > 6 && (
          <div className="flex-1 bg-surface-raised" title="Other projects" />
        )}
      </div>

      {/* Legend */}
      {displayProjects.map((project, i) => {
        const count = project.contributor_count || 0;
        const pct = ((count / total) * 100).toFixed(0);
        const color = CHART_COLORS[i % CHART_COLORS.length];
        return (
          <div key={project.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: color.bar }}
              />
              <span className="text-sm text-fg-primary truncate" title={project.title}>
                {project.title}
              </span>
            </div>
            <span className="text-sm text-fg-secondary ml-2 shrink-0">
              {count} ({pct}%)
            </span>
          </div>
        );
      })}

      <div className="pt-2 border-t border-default flex justify-between text-xs text-fg-secondary">
        <span>{withSupporters.length} projects</span>
        <span>{total} total supporters</span>
      </div>
    </div>
  );
}

export default function AnalyticsInsights({ projects }: AnalyticsInsightsProps) {
  const insights = deriveInsights(projects);

  return (
    <>
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Funding Progress
            </CardTitle>
            <CardDescription>Each project vs its funding goal</CardDescription>
          </CardHeader>
          <CardContent>
            <FundingProgressChart projects={projects} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Supporter Distribution
            </CardTitle>
            <CardDescription>How supporters are spread across projects</CardDescription>
          </CardHeader>
          <CardContent>
            <SupporterDistributionChart projects={projects} />
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Project Insights
          </CardTitle>
          <CardDescription>Derived from your selected projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.length > 0 ? (
              insights.map((insight, i) => {
                const c = COLOR_CLASSES[insight.color];
                const Icon = insight.icon;
                return (
                  <div key={i} className={`p-4 ${c.bg} border ${c.border} rounded-lg`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${c.icon} mt-0.5`} />
                      <div>
                        <h4 className={`font-medium ${c.title}`}>{insight.title}</h4>
                        <p className={`${c.body} text-sm mt-1`}>{insight.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-fg-secondary">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Create your first project to see insights</p>
                <Button href={ROUTES.PROJECTS.CREATE} className="mt-4">
                  Create Project
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
