import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api/standardResponse';

export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return apiError('Not authenticated', 401);
    }

    const debugResults = {
      authenticated: true,
      userId: user.id,
      userEmail: user.email,
      tableCheck: null,
      policyCheck: null,
      serviceCreation: null
    };

    // Test table access
    try {
      const { data, error } = await supabase
        .from('user_services')
        .select('count')
        .limit(1);
      
      debugResults.tableCheck = error ? 
        { success: false, error: error.message } : 
        { success: true, data };
    } catch (e) {
      debugResults.tableCheck = { success: false, error: e.message };
    }

    // Test service creation
    const testService = {
      user_id: user.id,
      title: 'Debug Service Creation Test',
      description: 'Testing service creation from debug endpoint',
      category: 'Other',
      fixed_price_sats: 1000,
      currency: 'SATS',
      status: 'draft'
    };

    try {
      const { data, error } = await supabase
        .from('user_services')
        .insert(testService)
        .select()
        .single();
      
      debugResults.serviceCreation = error ? 
        { success: false, error: error.message, code: error.code, details: error.details } : 
        { success: true, data };
    } catch (e) {
      debugResults.serviceCreation = { success: false, error: e.message };
    }

    return apiSuccess(debugResults);

  } catch (error) {
    return apiError('Debug failed: ' + error.message, 500);
  }
};
