import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', url ? url.substring(0, 40) + '...' : 'NOT SET');
console.log('PUBLISHABLE_KEY:', publishableKey ? `SET (${publishableKey.length} chars)` : 'NOT SET');
console.log('ANON_KEY:', anonKey ? `SET (${anonKey.length} chars)` : 'NOT SET');

// Check if keys look valid (JWT format)
const isValidJWT = (key) => key && key.startsWith('eyJ') && key.split('.').length === 3;
console.log('Publishable Key valid JWT:', isValidJWT(publishableKey));
console.log('Anon Key valid JWT:', isValidJWT(anonKey));

// Are they the same?
console.log('Keys are same:', publishableKey === anonKey);

// The server uses: PUBLISHABLE_KEY || ANON_KEY
const serverKey = publishableKey || anonKey;
console.log('Server would use:', publishableKey ? 'PUBLISHABLE_KEY' : 'ANON_KEY');

// Try each key
async function testKey(name, key) {
  console.log(`\n--- Testing with ${name} ---`);
  if (!key) {
    console.log('KEY NOT SET');
    return;
  }
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client.from('notifications').select('id').limit(1);
  if (error) {
    console.log('ERROR:', error.message || JSON.stringify(error));
  } else {
    console.log('SUCCESS! Data:', data);
  }
}

await testKey('PUBLISHABLE_KEY', publishableKey);
await testKey('ANON_KEY', anonKey);

const key = serverKey;

if (!url || !key) {
  console.log('Missing credentials');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false }
});

console.log('\n1. Testing notifications table with data fetch...');
const start1 = Date.now();

const { data, error } = await supabase
  .from('notifications')
  .select('id')
  .limit(1);

console.log('Elapsed:', Date.now() - start1 + 'ms');

if (error) {
  console.log('ERROR:', JSON.stringify(error, null, 2));
} else {
  console.log('SUCCESS - data:', data);
}

console.log('\n2. Testing with specific user filter...');
const start2 = Date.now();

const { count: userCount, error: userErr } = await supabase
  .from('notifications')
  .select('id', { count: 'exact', head: true })
  .eq('recipient_user_id', '22405777-66b2-4e3e-b346-4606758234d8')
  .eq('read', false);

console.log('Elapsed:', Date.now() - start2 + 'ms');

if (userErr) {
  console.log('ERROR:', JSON.stringify(userErr, null, 2));
} else {
  console.log('SUCCESS - unread for user:', userCount);
}

console.log('\n3. Discovering table columns using SQL...');
// Use a raw SQL query via function to discover columns
const testCols = ['id', 'user_id', 'recipient_user_id', 'type', 'title', 'message', 'read', 'is_read', 'created_at', 'actor_id'];

for (const col of testCols) {
  const { error } = await supabase.from('notifications').select(col).limit(1);
  const status = error ? `❌ ${error.message?.slice(0, 50)}` : '✅';
  console.log(`  ${col}: ${status}`);
}
