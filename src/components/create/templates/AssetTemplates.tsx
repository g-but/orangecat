/**
 * AssetTemplates Component
 *
 * Quick-start inspiration for asset creation.
 * Mirrors the project template UX with concise, realistic examples.
 */

'use client';

import React from 'react';
import { Building, Warehouse, Car, Shield } from 'lucide-react';
import Card from '@/components/ui/Card';
import { type CurrencyCode } from '@/config/currencies';

export interface AssetTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  tagline: string;
  data: {
    title: string;
    type: 'real_estate' | 'business' | 'vehicle' | 'equipment' | 'securities' | 'other';
    description?: string | null;
    location?: string | null;
    estimated_value?: number | null;
    currency?: CurrencyCode;
  };
}

export const ASSET_TEMPLATES: AssetTemplate[] = [
  {
    id: 'rental-unit',
    name: 'Rental Apartment',
    icon: <Building className="w-5 h-5" />,
    tagline: 'Income-producing city apartment, used as loan collateral',
    data: {
      title: 'Zurich 2BR Rental (Kreis 4)',
      type: 'real_estate',
      description:
        'Well-maintained 2-bedroom apartment in Kreis 4, Zurich. Long-term tenant with on-time payments. Recently updated kitchen and windows; no outstanding repairs planned.',
      location: 'Zurich, Switzerland',
      estimated_value: 850000,
      currency: 'CHF',
    },
  },
  {
    id: 'mining-rig',
    name: 'Mining Hardware',
    icon: <Warehouse className="w-5 h-5" />,
    tagline: 'Bitcoin mining rig with documented hash rate',
    data: {
      title: 'S19 XP Hyd. Miner (Managed)',
      type: 'equipment',
      description:
        'Antminer S19 XP Hyd. hosted at managed facility. Clean uptime history, 255 TH/s average over last 30 days. Includes service contract and monitoring dashboard access.',
      location: 'Lugano, Switzerland',
      estimated_value: 6500,
      currency: 'USD',
    },
  },
  {
    id: 'delivery-van',
    name: 'Delivery Van',
    icon: <Car className="w-5 h-5" />,
    tagline: 'Small business vehicle with service history',
    data: {
      title: '2021 VW Transporter T6.1',
      type: 'vehicle',
      description:
        'Used for local deliveries (food service). Single owner, full service history, 62k km mileage. Comes with winter tires and dashcam.',
      location: 'Bern, Switzerland',
      estimated_value: 24500,
      currency: 'CHF',
    },
  },
  {
    id: 'equity-stake',
    name: 'Startup Equity',
    icon: <Shield className="w-5 h-5" />,
    tagline: 'Minority equity position in revenue-generating SaaS',
    data: {
      title: 'Equity Stake – SaaS AR Platform',
      type: 'business',
      description:
        '7% equity stake in B2B SaaS for AR training. ARR ~CHF 480k, 30% YoY growth, low churn. Cap table and shareholder agreement available on request.',
      location: 'Remote-first',
      estimated_value: 80000,
      currency: 'CHF',
    },
  },
];

interface AssetTemplatesProps {
  onSelectTemplate: (template: AssetTemplate) => void;
  className?: string;
}

export function AssetTemplates({ onSelectTemplate, className = '' }: AssetTemplatesProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Asset Examples</h3>
      </div>
      <p className="text-sm text-gray-600">
        Click an example to prefill the form. Adjust details to match your asset.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ASSET_TEMPLATES.map(template => (
          <Card
            key={template.id}
            className="p-4 hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-blue-200"
            onClick={() => onSelectTemplate(template)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                {template.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">{template.name}</h4>
                <p className="text-xs text-gray-600 line-clamp-2">{template.tagline}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-800">
          💡 Examples are starting points. Verify values and avoid sensitive data before saving.
        </p>
      </div>
    </div>
  );
}

