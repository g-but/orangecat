import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/services/currency';
import { BarChart3 } from 'lucide-react';

interface ProjectPerformance {
  id: string;
  title: string;
  totalRaised: number;
  goalAmount: number;
  supporters: number;
  avgContribution: number;
  daysActive: number;
}

interface ProjectPerformanceTableProps {
  projects: ProjectPerformance[];
}

export default function ProjectPerformanceTable({ projects }: ProjectPerformanceTableProps) {
  if (projects.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Project Performance</CardTitle>
          <CardDescription>Detailed breakdown of your project metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
            <BarChart3 className="h-10 w-10 mb-3 text-gray-300" />
            <p className="font-medium text-gray-700">No project data yet</p>
            <p className="text-sm mt-1">
              Create a project and receive funding to see performance metrics here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Project Performance</CardTitle>
        <CardDescription>Detailed breakdown of your project metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Project</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Raised</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Goal</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Progress</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Supporters</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Avg Contribution</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => {
                const progress =
                  project.goalAmount > 0
                    ? Math.min((project.totalRaised / project.goalAmount) * 100, 100)
                    : 0;

                return (
                  <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{project.title}</p>
                        <p className="text-sm text-gray-500">{project.daysActive} days active</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {formatCurrency(project.totalRaised, 'BTC')}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatCurrency(project.goalAmount, 'BTC')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">{project.supporters}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatCurrency(project.avgContribution, 'BTC')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export type { ProjectPerformance };
