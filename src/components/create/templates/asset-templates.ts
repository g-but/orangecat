/**
 * Asset Templates
 *
 * Template definitions for asset creation.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

import React from 'react';
import { Building, Warehouse, Car, Shield } from 'lucide-react';
import type { EntityTemplate } from '../types';
import type { CurrencyCode } from '@/config/currencies';

export interface AssetDefaults {
  title: string;
  type: 'real_estate' | 'business' | 'vehicle' | 'equipment' | 'securities' | 'other';
  description?: string | null;
  location?: string | null;
  estimated_value?: number | null;
  currency?: CurrencyCode;
}

export const ASSET_TEMPLATES: EntityTemplate<AssetDefaults>[] = [
  {
    id: 'rental-unit',
    name: 'Rental Apartment',
    icon: React.createElement(Building, { className: 'w-4 h-4' }),
    tagline: 'Income-producing city apartment, used as loan collateral',
    defaults: {
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
    icon: React.createElement(Warehouse, { className: 'w-4 h-4' }),
    tagline: 'Bitcoin mining rig with documented hash rate',
    defaults: {
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
    icon: React.createElement(Car, { className: 'w-4 h-4' }),
    tagline: 'Small business vehicle with service history',
    defaults: {
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
    icon: React.createElement(Shield, { className: 'w-4 h-4' }),
    tagline: 'Minority equity position in revenue-generating SaaS',
    defaults: {
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


