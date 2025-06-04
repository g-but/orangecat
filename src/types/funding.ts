import { CategoryValue } from '@/config/categories'

export interface FundingPage {
  id: string
  user_id: string
  title: string
  description?: string
  bitcoin_address?: string
  lightning_address?: string
  website_url?: string
  goal_amount?: number
  current_amount?: number
  total_funding: number
  contributor_count: number
  is_active: boolean
  is_public: boolean
  is_featured?: boolean
  slug?: string
  category?: CategoryValue
  tags?: string[]
  featured_image_url?: string
  end_date?: string
  currency?: 'BTC' | 'SATS'
  created_at: string
  updated_at: string
}

export interface FundingPageFormData {
  title: string
  description?: string
  bitcoin_address?: string
  lightning_address?: string
  website_url?: string
  goal_amount?: number
  categories?: string[] // Changed from single category to array
  tags?: string[]
  currency?: 'BTC' | 'SATS'
  end_date?: string
}

export interface PublicFundingPage extends FundingPage {
  username?: string
  display_name?: string
  avatar_url?: string
}

export interface Transaction {
  id: string
  funding_page_id: string
  amount: number
  transaction_hash: string
  status: 'pending' | 'confirmed' | 'failed'
  created_at: string
  updated_at: string
} 