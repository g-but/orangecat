import { createClient } from '@/lib/supabase/client'

export async function getFundingPages(userId: string) {
  const supabase = createClient()
  if (!supabase) {
    console.error('Failed to create Supabase client')
    return []
  }
  
  const { data: fundingPages, error } = await supabase
    .from('funding_pages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching funding pages:', error)
    return []
  }

  return fundingPages
}

export async function getTransactions(userId: string) {
  const supabase = createClient()
  if (!supabase) {
    console.error('Failed to create Supabase client')
    return []
  }
  
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching transactions:', error)
    return []
  }

  return transactions
} 