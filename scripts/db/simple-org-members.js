#!/usr/bin/env node

/**
 * Simple Organization Members Creation
 * Test if we can create the organization_members table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createSimpleMembersTable() {
  try {
    console.log('🚀 Creating simple organization_members table...\n');

    // Try to create a simple organization first to test
    const testUserId = '00000000-0000-0000-0000-000000000000'; // Placeholder

    // Let's first see if we can create an organization with the correct columns
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Orange Cat',
        slug: 'orange-cat',
        description: 'Bitcoin-powered crowdfunding platform development',
        website: 'https://orangecat.org',
        bitcoin_address: 'bc1qplaceholder',
        lightning_address: 'placeholder@lightning.address',
        created_by: testUserId
      })
      .select();

    if (orgError) {
      console.log('❌ Organization creation failed:', orgError.message);
      console.log('This suggests the organizations table schema is different than expected.');
      console.log('Let me check what columns actually exist...');

      // Try to insert with minimal fields
      const { data: minOrgData, error: minOrgError } = await supabase
        .from('organizations')
        .insert({
          name: 'Orange Cat',
          slug: 'orange-cat'
        })
        .select();

      if (minOrgError) {
        console.log('❌ Even minimal insert failed:', minOrgError.message);
      } else {
        console.log('✅ Minimal organization created:', minOrgData);
      }
    } else {
      console.log('✅ Organization created successfully:', orgData);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createSimpleMembersTable();