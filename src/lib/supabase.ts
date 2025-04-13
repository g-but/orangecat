import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Database types
export type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  website?: string;
  bitcoin_address?: string;
  lightning_address?: string;
  social_links?: {
    twitter?: string;
    nostr?: string;
    github?: string;
  };
  created_at: string;
  updated_at: string;
};

export type FundingPage = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  goal_amount_btc: number;
  current_amount_btc: number;
  status: 'active' | 'completed' | 'cancelled';
  bitcoin_address: string;
  lightning_address: string;
  created_at: string;
  updated_at: string;
};

export type Donation = {
  id: string;
  funding_page_id: string;
  donor_id?: string;
  amount_btc: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  transaction_id: string;
  payment_type: 'bitcoin' | 'lightning';
}; 