import { type CurrencyCode } from '@/config/currencies';

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
  verification_status: 'unverified' | 'user_provided' | 'third_party_verified';
  status: 'draft' | 'active' | 'archived';
  // Additional fields
  purchase_date: string | null;
  purchase_price: number | null;
  documentation_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
