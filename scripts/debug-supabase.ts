#!/usr/bin/env node
/**
 * Supabase connection debug script
 * 
 * Run with:
 * npx tsx scripts/debug-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import dns from 'dns';
import { performance } from 'perf_hooks';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envFiles = ['.env.local', '.env'];
envFiles.forEach(file => {
  const envPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    // REMOVED: console.log statement
    dotenv.config({ path: envPath });
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are defined in .env.local');
  process.exit(1);
}

// At this point, we've confirmed supabaseUrl and supabaseAnonKey are defined
const url = supabaseUrl as string;
const key = supabaseAnonKey as string;

// REMOVED: console.log statement

// Test DNS resolution
async function testDns() {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  
  // REMOVED: console.log statement
  
  return new Promise<void>((resolve) => {
    const startTime = performance.now();
    dns.lookup(hostname, (err, address, family) => {
      const endTime = performance.now();
      if (err) {
        console.error(`❌ DNS lookup failed: ${err.message}`);
      } else {
        if (process.env.NODE_ENV === 'development') console.log(`✅ DNS resolved to: ${address} (IPv${family})`);
        // REMOVED: console.log statement
      }
      resolve();
    });
  });
}

// Test HTTP connection
async function testHttpConnection() {
  // REMOVED: console.log statement
  
  try {
    const startTime = performance.now();
    const response = await fetch(`${url}/healthz`, { 
      method: 'HEAD', 
      headers: { 'Cache-Control': 'no-cache' }
    });
    const endTime = performance.now();
    
    if (process.env.NODE_ENV === 'development') console.log(`✅ HTTP connection successful (${response.status})`);
    // REMOVED: console.log statement
    return true;
  } catch (error: any) {
    console.error(`❌ HTTP connection failed: ${error.message}`);
    return false;
  }
}

// Test Supabase API with a simple query
async function testSupabaseApi() {
  // REMOVED: console.log statement
  
  const supabase = createClient(url, key);
  
  try {
    const startTime = performance.now();
    const { data, error, status } = await supabase
      .from('profiles')
      .select('count(*)', { count: 'exact', head: true });
    const endTime = performance.now();
    
    if (error) {
      console.error(`❌ Supabase query failed: ${error.message} (status: ${status})`);
      return false;
    }
    
    if (process.env.NODE_ENV === 'development') console.log(`✅ Supabase query successful`);
    // REMOVED: console.log statement
    return true;
  } catch (error: any) {
    console.error(`❌ Supabase query exception: ${error.message}`);
    return false;
  }
}

// Test a profile update (no actual update, just test permission)
async function testProfileUpdate() {
  // REMOVED: console.log statement
  
  const supabase = createClient(url, key);
  
  try {
    // This is a dry run - won't actually update anything
    const { data, error, status } = await supabase.rpc('check_profile_update_permission');
    
    if (error) {
      if (error.message.includes('does not exist')) {
        // REMOVED: console.log statement
        // REMOVED: console.log statement
        return true;
      }
      
      console.error(`❌ Permission check failed: ${error.message} (status: ${status})`);
      return false;
    }
    
    if (process.env.NODE_ENV === 'development') console.log(`✅ Profile update permission check passed`);
    return true;
  } catch (error: any) {
    console.error(`❌ Permission check exception: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  // REMOVED: console.log statement
  
  await testDns();
  const httpSuccess = await testHttpConnection();
  
  if (!httpSuccess) {
    console.error('\n❌ HTTP connection failed. Skipping API tests.');
    process.exit(1);
  }
  
  await testSupabaseApi();
  await testProfileUpdate();
  
  // REMOVED: console.log statement
}

runTests().catch(err => {
  console.error('Test failed with exception:', err);
  process.exit(1);
}); 