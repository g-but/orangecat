#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || anon;

if (!url || !service) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON for read-only).');
  process.exit(1);
}

const supabase = createClient(url, service, { auth: { persistSession: false } });

const tables = [
  'profiles',
  'projects',
  'project_media',
  'wallets',
  'user_products',
  'user_services',
  'assets',
  'conversations',
  'conversation_participants',
  'messages',
  'follows',
  'organizations',
  'organization_members',
];

console.log('Auditing Supabase schema...');
for (const table of tables) {
  const { data, error } = await supabase.from(table).select('count').limit(1);
  if (error) {
    console.log(`- ${table}: MISSING or no access (${error.code || error.message})`);
  } else {
    console.log(`- ${table}: OK`);
  }
}

// Check RPC function optionally used by wallets
try {
  const { data, error } = await supabase.rpc('get_entity_wallets', {
    p_entity_type: 'profile',
    p_entity_id: '00000000-0000-0000-0000-000000000000',
  });
  if (error) throw error;
  console.log('- rpc:get_entity_wallets: OK');
} catch (e) {
  console.log('- rpc:get_entity_wallets: MISSING or no access');
}

console.log('Audit complete.');

