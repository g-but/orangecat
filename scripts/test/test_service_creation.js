// Test service creation directly to debug RLS issues
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ohkueislstxomdjavyhs.supabase.co';
const supabaseKey = 'REPLACE_WITH_ENV_VAR';

async function testServiceCreation() {
  console.log('🧪 Testing service creation...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test 1: Check if user_services table exists
    console.log('📋 Test 1: Checking table existence...');
    const { data: services, error: tableError } = await supabase
      .from('user_services')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table check failed:', tableError.message);
      console.error('❌ Error code:', tableError.code);
      return;
    }
    console.log('✅ user_services table exists');
    
    // Test 2: Try to create a service with a fake user ID
    console.log('🔧 Test 2: Attempting service creation...');
    const testService = {
      user_id: 'test-user-id-123',
      title: 'Test Car Repair Service',
      description: 'Professional automotive repair services',
      category: 'Other',
      fixed_price_sats: 100000,
      currency: 'SATS',
      duration_minutes: 120,
      service_location_type: 'both',
      status: 'draft'
    };
    
    const { data, error } = await supabase
      .from('user_services')
      .insert(testService)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Service creation failed:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error details:', error.details);
    } else {
      console.log('✅ Service created successfully:', data);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testServiceCreation();
