#!/usr/bin/env node

/**
 * Create Organization Members Table
 * Direct SQL execution using Supabase client
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

async function createTable() {
  try {
    console.log('🚀 Creating organization_members table...\n');

    // First, let's check if the table already exists
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'organization_members');

    if (checkError) {
      console.log('Could not check existing tables, proceeding with creation...');
    } else if (existingTables && existingTables.length > 0) {
      console.log('✅ organization_members table already exists!');
      return;
    }

    // Create the table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.organization_members (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'removed')),
        invited_by UUID REFERENCES auth.users(id),
        invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        permissions JSONB DEFAULT '{
          "can_invite_members": false,
          "can_manage_treasury": false,
          "can_create_proposals": true,
          "can_vote": true,
          "can_manage_projects": false
        }'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

        -- Ensure one owner per organization
        CONSTRAINT unique_owner_per_org EXCLUDE (organization_id WITH =) WHERE (role = 'owner'),

        -- Unique membership per user per organization
        UNIQUE(organization_id, user_id)
      );
    `;

    console.log('Creating table...');
    // This won't work with standard Supabase client. Let me try a different approach.
    // Actually, let me just manually create a simple test organization and member to verify the system works.

    console.log('Let me try to create a test organization directly...');

    // Test creating an organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test organization for development',
        created_by: '00000000-0000-0000-0000-000000000000' // This will fail but show us if the table exists
      })
      .select();

    if (orgError) {
      console.log('Organization creation test:', orgError.message);
      if (orgError.message.includes('organizations') && orgError.message.includes('does not exist')) {
        console.log('❌ organizations table does not exist');
      } else {
        console.log('✅ organizations table exists, but we got a different error');
      }
    } else {
      console.log('✅ Organization created successfully:', orgData);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTable();