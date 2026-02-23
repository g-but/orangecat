import supabase from '@/lib/supabase/browser';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

export async function getContract(contractId: string) {
  try {
    const { data, error } = await (supabase.from(DATABASE_TABLES.CONTRACTS) as any)
      .select('*')
      .eq('id', contractId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, contract: data };
  } catch (error) {
    logger.error('Exception getting contract', error, 'Contracts');
    return { success: false, error: 'Failed to get contract' };
  }
}
