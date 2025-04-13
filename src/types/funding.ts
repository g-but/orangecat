export interface FundingPage {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  user_id: string
  bitcoin_address?: string
  lightning_address?: string
  is_active: boolean
  total_funding: number
  contributor_count: number
  goal_amount?: number
  current_amount: number
} 