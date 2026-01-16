export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;

  goal_amount: number;
  goal_currency: string; // mapped from DB 'currency'

  bitcoin_address?: string | null;
  lightning_address?: string | null;

  bitcoin_balance_btc: number;
  bitcoin_balance_updated_at: string | null;

  // Legacy fallback
  raised_amount?: number;

  // Media
  website_url?: string | null;
  cover_image_url?: string | null;

  status: string;
  category?: string | null;
  tags?: string[] | null;
  funding_purpose?: string | null;

  created_at: string;
  updated_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProjectRow(row: any): Project {
  return {
    ...row,
    goal_currency: row.currency,
  };
}

export interface ProjectMedia {
  id: string;
  project_id: string;
  storage_path: string;
  position: number;
  alt_text?: string | null;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMediaUrl(supabase: any, storagePath: string): string {
  const { data } = supabase.storage.from('project-media').getPublicUrl(storagePath);
  return data.publicUrl;
}
