#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !service) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to run this audit.')
  process.exit(1)
}

const supabase = createClient(url, service, { auth: { persistSession: false } })

const TABLES = [
  // Core
  'profiles','projects','project_media','follows',
  // Commerce
  'user_products','user_services','assets',
  // Wallets / social
  'wallets','conversations','conversation_participants','messages',
  // Orgs
  'organizations','organization_members',
  // Loans
  'loans','loan_offers','loan_payments',
]

const RECOMMENDED_INDEXES = {
  profiles: ['(username)', '(email)', '(created_at)', '(updated_at)'],
  projects: ['(user_id)', '(status)', '(created_at)', '(category)'],
  project_media: ['(project_id)', '(created_at)'],
  follows: ['(follower_id)', '(following_id)'],
  user_products: ['(user_id)', '(status)', '(created_at)', '(category)'],
  user_services: ['(user_id)', '(status)', '(created_at)', '(category)'],
  assets: ['(owner_id)', '(status)', '(created_at)', '(type)'],
  wallets: ['(profile_id)', '(project_id)', '(is_active)', '(created_at)'],
  conversations: ['(created_by)', '(created_at)', '(last_message_at)'],
  conversation_participants: ['(conversation_id)', '(user_id)'],
  messages: ['(conversation_id)', '(sender_id)', '(created_at)'],
  organizations: ['(slug)', '(created_at)'],
  organization_members: ['(organization_id)', '(user_id)', '(status)'],
  loans: ['(user_id)', '(status)', '(created_at)', '(loan_category_id)'],
  loan_offers: ['(loan_id)', '(offerer_id)', '(status)'],
  loan_payments: ['(loan_id)', '(payer_id)', '(created_at)'],
}

async function tableExists(name) {
  const { data, error } = await supabase
    .from('pg_catalog.pg_tables')
    .select('tablename')
    .eq('schemaname', 'public')
    .eq('tablename', name)
  if (error) return false
  return Array.isArray(data) && data.length > 0
}

async function getColumns(name) {
  const { data } = await supabase.rpc('exec_sql', {
    q: `select column_name, data_type, is_nullable from information_schema.columns where table_schema='public' and table_name='${name}' order by ordinal_position;`
  }).catch(() => ({ data: null }))
  return data || []
}

async function getIndexes(name) {
  const { data } = await supabase.rpc('exec_sql', {
    q: `select indexname, indexdef from pg_indexes where schemaname='public' and tablename='${name}';`
  }).catch(() => ({ data: null }))
  return data || []
}

async function getForeignKeys(name) {
  const { data } = await supabase.rpc('exec_sql', {
    q: `
      select tc.constraint_name, kcu.column_name, ccu.table_name as foreign_table_name, ccu.column_name as foreign_column_name
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
      join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
      where tc.constraint_type = 'FOREIGN KEY' and tc.table_name='${name}';
    `
  }).catch(() => ({ data: null }))
  return data || []
}

async function getPolicies(name) {
  const { data } = await supabase.rpc('exec_sql', {
    q: `select policyname, permissive, roles, cmd, qual, with_check from pg_policies where schemaname='public' and tablename='${name}';`
  }).catch(() => ({ data: null }))
  return data || []
}

async function hasRlsEnabled(name) {
  const { data } = await supabase.rpc('exec_sql', {
    q: `select relrowsecurity from pg_class join pg_namespace n on n.oid=pg_class.relnamespace where n.nspname='public' and relname='${name}';`
  }).catch(() => ({ data: null }))
  if (!data || !Array.isArray(data) || data.length === 0) return null
  const val = data[0]?.relrowsecurity
  return val === true || val === 't'
}

console.log('--- Database Audit (extended) ---')
for (const t of TABLES) {
  const exists = await tableExists(t)
  if (!exists) {
    console.log(`- ${t}: MISSING`)
    continue
  }
  console.log(`- ${t}: OK`)
  const [cols, idxs, fks, rls, policies] = await Promise.all([
    getColumns(t),
    getIndexes(t),
    getForeignKeys(t),
    hasRlsEnabled(t),
    getPolicies(t),
  ])

  const idxDefs = (idxs || []).map((i) => i.indexdef || '').join('\n')
  const rec = RECOMMENDED_INDEXES[t] || []
  for (const need of rec) {
    if (!idxDefs.includes(need)) {
      console.log(`  · Recommend index on ${need}`)
    }
  }
  if ((fks || []).length === 0 && ['conversation_participants','messages','project_media','organization_members','loan_offers','loan_payments'].includes(t)) {
    console.log('  · No foreign keys found; verify relational integrity')
  }

  if (rls === false) {
    console.log('  · RLS disabled; enable Row Level Security and define policies')
  }
  if ((policies || []).length === 0 && ['user_products','user_services','assets','projects','loans'].includes(t)) {
    console.log('  · No policies found; add owner-scoped INSERT/UPDATE/DELETE/SELECT policies')
  }
}

console.log('--- End of Audit ---')

