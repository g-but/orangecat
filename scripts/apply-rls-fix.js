#!/usr/bin/env node

/**
 * Apply Essential RLS Policies Fix
 *
 * Applies only the critical RLS policies needed for commerce features to work.
 * This is a minimal fix for the immediate blocking issues.
 */

const fs = require('fs');
const path = require('path');

// Since we can't connect to Supabase directly, let's create a simple script
// that outputs the essential SQL for manual application

console.log('🔧 ORANGECAT ESSENTIAL RLS POLICIES FIX');
console.log('==========================================\n');

console.log('📋 CRITICAL ISSUE: Commerce features blocked by missing RLS policies\n');

console.log('🎯 IMMEDIATE FIX: Apply these RLS policies in Supabase SQL Editor\n');

const rlsPolicies = `
-- ===========================================
-- ESSENTIAL RLS POLICIES FOR COMMERCE FEATURES
-- ===========================================

-- Enable RLS on commerce tables
ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe to run multiple times)
DROP POLICY IF EXISTS user_products_select ON public.user_products;
DROP POLICY IF EXISTS user_products_modify ON public.user_products;
DROP POLICY IF EXISTS user_services_select ON public.user_services;
DROP POLICY IF EXISTS user_services_modify ON public.user_services;
DROP POLICY IF EXISTS assets_select ON public.assets;
DROP POLICY IF EXISTS assets_modify ON public.assets;
DROP POLICY IF EXISTS projects_select ON public.projects;
DROP POLICY IF EXISTS projects_modify ON public.projects;
DROP POLICY IF EXISTS loans_select ON public.loans;
DROP POLICY IF EXISTS loans_modify ON public.loans;

-- Apply owner-scoped policies
CREATE POLICY user_products_select ON public.user_products
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_products_modify ON public.user_products
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY user_services_select ON public.user_services
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_services_modify ON public.user_services
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY assets_select ON public.assets
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY assets_modify ON public.assets
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY projects_select ON public.projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY projects_modify ON public.projects
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY loans_select ON public.loans
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY loans_modify ON public.loans
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ===========================================
-- VERIFICATION QUERY
-- ===========================================

-- Run this after applying the policies:
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  policies.polname as policy_name,
  policies.polcmd as policy_command
FROM pg_tables t
LEFT JOIN pg_policies policies ON policies.tablename = t.tablename
WHERE schemaname = 'public'
  AND t.tablename IN ('user_products', 'user_services', 'assets', 'projects', 'loans')
ORDER BY t.tablename, policies.polname;
`;

console.log('📄 COPY AND PASTE THIS SQL INTO SUPABASE SQL EDITOR:\n');
console.log(rlsPolicies);

console.log('\n🔍 AFTER APPLYING, VERIFY WITH:\n');
console.log('node scripts/db-verify-fixes.mjs');

console.log('\n✅ EXPECTED RESULTS:');
console.log('- ✅ Commerce features (products, services) should work');
console.log('- ✅ Project creation should still work');
console.log('- ✅ Loan requests should work');
console.log('- ✅ All owner-scoped data security maintained');

console.log('\n🚀 READY TO CONTINUE BROWSER TESTING!');











