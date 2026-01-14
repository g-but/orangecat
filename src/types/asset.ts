import { type CurrencyCode } from '@/config/currencies';
import { type EntityStatus, type VerificationStatus } from '@/types/common';

export type AssetType =
  | 'real_estate'
  | 'business'
  | 'vehicle'
  | 'equipment'
  | 'securities'
  | 'other';

export interface Asset {
  id: string;
  owner_id: string;
  type: AssetType;
  title: string;
  description: string | null;
  location: string | null;
  estimated_value: number | null;
  currency: CurrencyCode; // e.g., 'USD', 'CHF', 'BTC'
  documents: string[] | null; // links to docs hosted in storage
  verification_status: VerificationStatus;
  status: Exclude<EntityStatus, 'paused'>; // Assets don't use 'paused' status
  // Additional fields
  purchase_date: string | null;
  purchase_price: number | null;
  documentation_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Index signature for BaseEntity compatibility
  [key: string]: unknown;
}
