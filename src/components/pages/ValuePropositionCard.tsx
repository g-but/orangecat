'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import BitcoinDisplay from '@/components/ui/BitcoinDisplay';
import DemoDataBanner from '@/components/ui/DemoDataBanner';

interface BulletPoint {
  text: string;
  color?: string;
}

interface DemoField {
  label: string;
  value: string | number;
  type?: 'text' | 'bitcoin' | 'number';
}

interface StatusIndicator {
  icon: LucideIcon;
  text: string;
  colors: string;
}

interface ValuePropositionCardProps {
  title: string;
  description: string;
  bulletPoints: BulletPoint[];
  bulletColor?: string;
  cardTitle: string;
  cardIcon: LucideIcon;
  cardIconColors: string;
  demoFields: DemoField[];
  statusIndicator: StatusIndicator;
}

export default function ValuePropositionCard({
  title,
  description,
  bulletPoints,
  bulletColor = 'bg-blue-500',
  cardTitle,
  cardIcon: CardIcon,
  cardIconColors,
  demoFields,
  statusIndicator,
}: ValuePropositionCardProps) {
  const StatusIcon = statusIndicator.icon;

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-center">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
        <div className="space-y-3">
          {bulletPoints.map((point, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-2 h-2 ${point.color || bulletColor} rounded-full`}></div>
              <span className="text-sm text-gray-700">{point.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{cardTitle}</h3>
              <div className={`p-2 rounded-lg ${cardIconColors}`}>
                <CardIcon className="w-6 h-6" />
              </div>
            </div>
            <DemoDataBanner className="mb-4" />
            <div className="space-y-4">
              {demoFields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-gray-100"
                >
                  <span className="text-gray-600">{field.label}</span>
                  {field.type === 'bitcoin' ? (
                    <BitcoinDisplay usdAmount={field.value as number} />
                  ) : (
                    <span className="font-semibold text-gray-900">{field.value}</span>
                  )}
                </div>
              ))}
            </div>
            <div
              className={`flex items-center gap-2 mt-6 p-3 rounded-lg ${statusIndicator.colors}`}
            >
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{statusIndicator.text}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
