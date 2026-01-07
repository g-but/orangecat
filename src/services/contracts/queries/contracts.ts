import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';

export async function getContract(contractId: string) {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (error) {return { success: false, error: error.message };}
    return { success: true, contract: data };
  } catch (error) {
    logger.error('Exception getting contract', error, 'Contracts');
    return { success: false, error: 'Failed to get contract' };
  }
}

