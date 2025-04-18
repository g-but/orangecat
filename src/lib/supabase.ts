import { createBrowserClient } from '@supabase/ssr'
import { Database, ProjectFundingPage, ProjectTransaction } from '@/types/database'
import { getProfile, updateProfile } from '@/lib/supabase/profile'

export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Helper functions for common operations
export const getUserProfile = getProfile

export const getFundingPages = async (userId: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('funding_pages')
    .select('*')
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error fetching funding pages:', error)
    throw new Error('Failed to fetch funding pages')
  }
  return data
}

export const getPublicFundingPage = async (id: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('funding_pages')
    .select('*, profiles(username, avatar_url)')
    .eq('id', id)
    .eq('is_public', true)
    .single()
  
  if (error) {
    console.error('Error fetching public funding page:', error)
    throw new Error('Failed to fetch funding page')
  }
  return data
}

export const getTransactions = async (fundingPageId: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('funding_page_id', fundingPageId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching transactions:', error)
    throw new Error('Failed to fetch transactions')
  }
  return data
}

export const createFundingPage = async (pageData: Database['public']['Tables']['funding_pages']['Insert']) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('funding_pages')
    .insert(pageData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating funding page:', error)
    throw new Error('Failed to create funding page')
  }
  return data
}

export const updateFundingPage = async (
  id: string,
  updates: Database['public']['Tables']['funding_pages']['Update']
) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('funding_pages')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating funding page:', error)
    throw new Error('Failed to update funding page')
  }
  return data
}

export const addTransaction = async (transactionData: Database['public']['Tables']['transactions']['Insert']) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionData)
    .select()
    .single()
  
  if (error) {
    console.error('Error adding transaction:', error)
    throw new Error('Failed to add transaction')
  }
  return data
}

export const getProjectFundingPage = async (projectId: string) => {
  const { data, error } = await createClient()
    .from('project_funding_pages')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data;
};

export const getProjectTransactions = async (projectId: string) => {
  const { data, error } = await createClient()
    .from('project_transactions')
    .select('*')
    .eq('project_id', projectId)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data;
};

export const createProjectFundingPage = async (projectData: Omit<ProjectFundingPage, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await createClient()
    .from('project_funding_pages')
    .insert(projectData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProjectFundingPage = async (
  projectId: string,
  updates: Partial<Omit<ProjectFundingPage, 'id' | 'created_at' | 'updated_at'>>
) => {
  const { data, error } = await createClient()
    .from('project_funding_pages')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const addProjectTransaction = async (transactionData: Omit<ProjectTransaction, 'id' | 'created_at'>) => {
  const { data, error } = await createClient()
    .from('project_transactions')
    .insert(transactionData)
    .select()
    .single();

  if (error) throw error;
  return data;
}; 