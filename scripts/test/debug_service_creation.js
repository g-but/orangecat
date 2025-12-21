// Comprehensive debug script for service creation
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ohkueislstxomdjavyhs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsImtpZCI6Ik13K25NM0twQVdEL1dLU2G0.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oa3VlaXNsc3R4b21kamF2eWhzIiwicm9sZSI6MjA2MDEyMzk1MH0.Qc6ahUbs_5BCa4csEYsBtyxNUDYb4h3Y4K_16N1DNaY';

async function debugServiceCreation() {
  console.log('🔍 Comprehensive Service Creation Debug\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test 1: Check authentication
  console.log('1️⃣ Testing Authentication...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.log('❌ Not authenticated:', authError?.message || 'No user');
    return;
  }
  console.log('✅ Authenticated as:', user.email, '(ID:', user.id, ')\n');

  // Test 2: Check table existence and RLS
  console.log('2️⃣ Testing Table Access...');
  try {
    const { data: services, error: tableError } = await supabase
      .from('user_services')
      .select('count')
      .limit(1);

    if (tableError) {
      console.log('❌ Table access failed:', tableError.message);
      return;
    }
    console.log('✅ user_services table accessible\n');
  } catch (e) {
    console.log('❌ Table access error:', e.message);
    return;
  }

  // Test 3: Check current RLS policies
  console.log('3️⃣ Checking RLS Policies...');
  try {
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'user_services');

    if (policyError) {
      console.log('⚠️ Cannot check policies (expected):', policyError.message);
    } else {
      console.log('📋 Current policies for user_services:');
      policies.forEach(p => {
        console.log(`  - ${p.policyname}: ${p.cmd} (${p.roles.join(',')})`);
      });
    }
    console.log('');
  } catch (e) {
    console.log('⚠️ Policy check error:', e.message, '\n');
  }

  // Test 4: Try minimal service creation
  console.log('4️⃣ Testing Minimal Service Creation...');
  const minimalService = {
    user_id: user.id, // Use actual user ID
    title: 'Debug Test Service',
    description: 'Test service for debugging',
    category: 'Other',
    status: 'draft'
  };

  console.log('📝 Attempting to create service with data:', minimalService);

  try {
    const { data, error } = await supabase
      .from('user_services')
      .insert(minimalService)
      .select()
      .single();

    if (error) {
      console.log('❌ Service creation failed with error:');
      console.log('   Code:', error.code);
      console.log('   Message:', error.message);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Service created successfully!');
      console.log('   Service ID:', data.id);
      console.log('   Title:', data.title);
    }
  } catch (e) {
    console.log('❌ Unexpected error during creation:', e.message);
  }

  console.log('\n🔍 Debug complete. Check results above.');
}

debugServiceCreation();
