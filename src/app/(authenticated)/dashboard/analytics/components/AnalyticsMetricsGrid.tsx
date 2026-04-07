import { Card, CardContent } from '@/components/ui/Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/services/currency';

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface AnalyticsMetricsGridProps {
  metrics: AnalyticsMetric[];
}

function getChangeIcon(changeType?: string) {
  switch (changeType) {
    case 'increase':
      return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    case 'decrease':
      return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    default:
      return null;
  }
}

function getChangeColor(changeType?: string) {
  switch (changeType) {
    case 'increase':
      return 'text-green-600';
    case 'decrease':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

export default function AnalyticsMetricsGrid({ metrics }: AnalyticsMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-100`}>
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {typeof metric.value === 'number' && metric.label === 'Total Raised'
                        ? formatCurrency(metric.value, 'BTC')
                        : typeof metric.value === 'number' && metric.label === 'Avg Donation'
                          ? formatCurrency(metric.value, 'BTC')
                          : metric.value}
                    </p>
                  </div>
                </div>

                {metric.change !== undefined && (
                  <div className={`flex items-center gap-1 ${getChangeColor(metric.changeType)}`}>
                    {getChangeIcon(metric.changeType)}
                    <span className="text-sm font-medium">{Math.abs(metric.change)}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export type { AnalyticsMetric };
