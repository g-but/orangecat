import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/services/currency';

interface CampaignPerformance {
  id: string;
  title: string;
  totalRaised: number;
  goalAmount: number;
  supporters: number;
  conversionRate: number;
  avgDonation: number;
  daysActive: number;
  views: number;
  shares: number;
}

interface CampaignPerformanceTableProps {
  campaigns: CampaignPerformance[];
}

export default function CampaignPerformanceTable({ campaigns }: CampaignPerformanceTableProps) {
  if (campaigns.length === 0) {return null;}

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Campaign Performance</CardTitle>
        <CardDescription>Detailed breakdown of your project metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Campaign</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Raised</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Goal</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Progress</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Supporters</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Avg Contribution</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Views</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Conv. Rate</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(project => {
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
                      {formatCurrency(project.avgDonation, 'BTC')}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{project.views}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-green-600">
                        {project.conversionRate.toFixed(1)}%
                      </span>
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

export type { CampaignPerformance };
