/**
 * Asset Templates
 *
 * Template definitions for asset creation.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

import React from 'react';
import { Building, Warehouse, Car, Shield, Bot, Plane, Cpu, Cog } from 'lucide-react';
import type { EntityTemplate } from '../types';
import type { CurrencyCode } from '@/config/currencies';

export interface AssetDefaults {
  title: string;
  type:
    | 'real_estate'
    | 'business'
    | 'vehicle'
    | 'equipment'
    | 'securities'
    | 'robot'
    | 'drone'
    | 'other';
  description?: string | null;
  location?: string | null;
  estimated_value?: number | null;
  currency?: CurrencyCode;
  // Rental fields
  is_for_rent?: boolean;
  rental_price_sats?: number | null;
  rental_period_type?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  min_rental_period?: number;
  requires_deposit?: boolean;
  deposit_amount_sats?: number | null;
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
  // Robot & Drone Templates
  {
    id: 'industrial-robot',
    name: 'Industrial Robot',
    icon: React.createElement(Cog, { className: 'w-4 h-4' }),
    tagline: 'Robotic equipment for manufacturing or automation tasks',
    defaults: {
      title: 'Universal Robots UR10e Cobot',
      type: 'robot',
      description:
        'Collaborative robot arm (cobot) for manufacturing automation. 10kg payload capacity, 1300mm reach. Includes force-torque sensor, gripper, and programming tablet. Recently serviced with certified maintenance records.',
      location: 'Zurich, Switzerland',
      estimated_value: 45000,
      currency: 'CHF',
      is_for_rent: true,
      rental_price_sats: 500000, // ~$200/day
      rental_period_type: 'daily',
      min_rental_period: 1,
      requires_deposit: true,
      deposit_amount_sats: 5000000, // ~$2000 deposit
    },
  },
  {
    id: 'service-robot',
    name: 'Service Robot',
    icon: React.createElement(Bot, { className: 'w-4 h-4' }),
    tagline: 'Robot for hospitality, delivery, or customer assistance',
    defaults: {
      title: 'Delivery Robot – Restaurant Service',
      type: 'robot',
      description:
        'Autonomous delivery robot for restaurant/hotel use. Multiple tray capacity, obstacle avoidance, and voice interaction. Suitable for food delivery, room service, or retail assistance.',
      location: 'Basel, Switzerland',
      estimated_value: 18000,
      currency: 'CHF',
      is_for_rent: true,
      rental_price_sats: 250000, // ~$100/day
      rental_period_type: 'daily',
      min_rental_period: 1,
      requires_deposit: true,
      deposit_amount_sats: 2500000, // ~$1000 deposit
    },
  },
  {
    id: 'inspection-drone',
    name: 'Inspection Drone',
    icon: React.createElement(Plane, { className: 'w-4 h-4' }),
    tagline: 'Professional drone for aerial photography and inspections',
    defaults: {
      title: 'DJI Matrice 300 RTK Inspection Drone',
      type: 'drone',
      description:
        'Enterprise-grade drone for industrial inspections, mapping, and aerial photography. 55-minute flight time, dual camera payload, RTK positioning. Includes thermal camera and hard case.',
      location: 'Geneva, Switzerland',
      estimated_value: 25000,
      currency: 'CHF',
      is_for_rent: true,
      rental_price_sats: 375000, // ~$150/hour
      rental_period_type: 'hourly',
      min_rental_period: 2,
      requires_deposit: true,
      deposit_amount_sats: 3750000, // ~$1500 deposit
    },
  },
  {
    id: 'agricultural-drone',
    name: 'Agricultural Drone',
    icon: React.createElement(Plane, { className: 'w-4 h-4' }),
    tagline: 'Drone for crop spraying, monitoring, and farm automation',
    defaults: {
      title: 'DJI Agras T40 Agricultural Drone',
      type: 'drone',
      description:
        'Large agricultural drone for precision spraying and spreading. 40L spray tank, 50kg spreading capacity. Ideal for vineyard management, crop protection, and fertilizer application.',
      location: 'Lausanne, Switzerland',
      estimated_value: 35000,
      currency: 'CHF',
      is_for_rent: true,
      rental_price_sats: 625000, // ~$250/hour
      rental_period_type: 'hourly',
      min_rental_period: 4,
      requires_deposit: true,
      deposit_amount_sats: 5000000, // ~$2000 deposit
    },
  },
  {
    id: 'warehouse-robot',
    name: 'Warehouse Robot',
    icon: React.createElement(Cpu, { className: 'w-4 h-4' }),
    tagline: 'Autonomous mobile robot for warehouse logistics',
    defaults: {
      title: 'Autonomous Mobile Robot (AMR) – Logistics',
      type: 'robot',
      description:
        'Fleet-ready warehouse robot for goods transport. 500kg payload, autonomous navigation, and integration-ready with WMS systems. Battery swap capability for 24/7 operation.',
      location: 'Bern, Switzerland',
      estimated_value: 55000,
      currency: 'CHF',
      is_for_rent: true,
      rental_price_sats: 750000, // ~$300/day
      rental_period_type: 'daily',
      min_rental_period: 7,
      requires_deposit: true,
      deposit_amount_sats: 7500000, // ~$3000 deposit
    },
  },
  {
    id: 'telepresence-robot',
    name: 'Telepresence Robot',
    icon: React.createElement(Bot, { className: 'w-4 h-4' }),
    tagline: 'Remote presence robot for meetings and virtual visits',
    defaults: {
      title: 'Telepresence Robot – Remote Collaboration',
      type: 'robot',
      description:
        'Mobile telepresence robot for remote meetings, facility tours, and virtual visits. HD camera, 360-degree navigation, and tablet interface. Perfect for remote work and distributed teams.',
      location: 'Zurich, Switzerland',
      estimated_value: 8000,
      currency: 'CHF',
      is_for_rent: true,
      rental_price_sats: 125000, // ~$50/day
      rental_period_type: 'daily',
      min_rental_period: 1,
      requires_deposit: true,
      deposit_amount_sats: 1250000, // ~$500 deposit
    },
  },
];
