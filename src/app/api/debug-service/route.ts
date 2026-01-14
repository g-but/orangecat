import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { apiSuccess, apiUnauthorized } from '@/lib/api/standardResponse';
import { getTableName } from '@/config/entity-registry';

export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return apiUnauthorized('Not authenticated');
    }

    // Use entity registry for table name (SSOT compliance)
    const tableName = getTableName('service');

    const debugResults: {
      authenticated: boolean;
      userId: string;
      userEmail: string | undefined;
      tableCheck: { success: boolean; error?: string; data?: any } | null;
      policyCheck: { success: boolean; error?: string } | null;
      serviceCreation: { success: boolean; error?: string; code?: string; details?: any; data?: any } | null;
    } = {
      authenticated: true,
      userId: user.id,
      userEmail: user.email,
      tableCheck: null,
      policyCheck: null,
      serviceCreation: null
    };

    // Test table access
    try {
      const { data, error } = await (supabase
        .from(tableName) as any)
        .select('count')
        .limit(1);
      
      debugResults.tableCheck = error ? 
        { success: false, error: error.message } : 
        { success: true, data };
    } catch (e) {
      debugResults.tableCheck = { success: false, error: e instanceof Error ? e.message : String(e) };
    }

    // Test service creation
    const testService = {
      user_id: user.id,
      title: 'Debug Service Creation Test',
      description: 'Testing service creation from debug endpoint',
      category: 'Other',
      fixed_price: 1000,
      currency: 'SATS',
      status: 'draft'
    };

    try {
      const { data, error } = await (supabase
        .from(tableName) as any)
        .insert(testService)
        .select()
        .single();
      
      debugResults.serviceCreation = error ? 
        { success: false, error: error.message, code: error.code, details: error.details } : 
        { success: true, data };
    } catch (e) {
      debugResults.serviceCreation = { success: false, error: e instanceof Error ? e.message : String(e) };
    }

    return apiSuccess(debugResults);

  } catch (error) {
    const { apiError } = await import('@/lib/api/standardResponse');
    return apiError('Debug failed: ' + (error instanceof Error ? error.message : String(error)), 'DEBUG_ERROR', 500);
  }
};
