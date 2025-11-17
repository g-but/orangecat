#!/usr/bin/env node

/**
 * Fix Profile Bootstrap
 * Creates a profile record for the authenticated user if missing
 */

const https = require('https');
const fs = require('fs');

const PROJECT_REF = 'ohkueislstxomdjavyhs';
const USER_ID = 'e4ccef93-e169-4a68-9121-f16e1b361a82'; // From the error message

// Read token from .env.local
let envToken = null;
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/SUPABASE_ACCESS_TOKEN=(.+)/);
  if (match) {
    envToken = match[1].trim();
  }
} catch (e) {
  console.error('Error reading .env.local:', e.message);
}

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || envToken;

if (!ACCESS_TOKEN) {
  console.error('❌ No access token found!');
  process.exit(1);
}

console.log('🔧 Fixing profile bootstrap for user:', USER_ID);
console.log('');

// First, check if profile exists
const checkQuery = `
  SELECT id, username, name, email
  FROM profiles
  WHERE id = '${USER_ID}'::uuid;
`;

console.log('1️⃣  Checking if profile exists...');

function makeRequest(query, callback) {
  const data = JSON.stringify({ query });
  const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${PROJECT_REF}/database/query`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  };

  const req = https.request(options, res => {
    let responseData = '';

    res.on('data', chunk => {
      responseData += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const result = JSON.parse(responseData);
          callback(null, result);
        } catch (e) {
          callback(new Error('Failed to parse response: ' + responseData));
        }
      } else {
        callback(new Error('HTTP ' + res.statusCode + ': ' + responseData));
      }
    });
  });

  req.on('error', error => {
    callback(error);
  });

  req.write(data);
  req.end();
}

// Step 1: Check if profile exists
makeRequest(checkQuery, (err, result) => {
  if (err) {
    console.error('   ❌ Error checking profile:', err.message);
    process.exit(1);
  }

  console.log('   Result:', JSON.stringify(result, null, 2));

  if (result && result.length > 0) {
    console.log('   ✅ Profile already exists!');
    console.log('');
    console.log('🎯 The profile exists in the database.');
    console.log('💡 The issue might be with RLS policies or API access.');
    console.log('');
    process.exit(0);
  }

  console.log('   ℹ️  Profile does not exist. Creating...');
  console.log('');

  // Step 2: Get user info from auth.users
  const getUserQuery = `
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE id = '${USER_ID}'::uuid;
  `;

  console.log('2️⃣  Fetching user data from auth.users...');

  makeRequest(getUserQuery, (err, userResult) => {
    if (err) {
      console.error('   ❌ Error fetching user:', err.message);
      process.exit(1);
    }

    console.log('   Result:', JSON.stringify(userResult, null, 2));

    if (!userResult || userResult.length === 0) {
      console.error('   ❌ User not found in auth.users!');
      process.exit(1);
    }

    const user = userResult[0];
    const email = user.email || 'user@example.com';
    const username = email.split('@')[0] || `user_${USER_ID.slice(0, 8)}`;
    const metadata = user.raw_user_meta_data || {};
    const name = metadata.full_name || metadata.name || metadata.display_name || username;

    console.log('   ✅ User found');
    console.log('   📧 Email:', email);
    console.log('   👤 Name:', name);
    console.log('   🏷️  Username:', username);
    console.log('');

    // Step 3: Create profile
    const createProfileQuery = `
      INSERT INTO profiles (id, username, name, email, status, created_at, updated_at)
      VALUES (
        '${USER_ID}'::uuid,
        '${username}',
        '${name}',
        '${email}',
        'active',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW()
      RETURNING id, username, name, email;
    `;

    console.log('3️⃣  Creating profile...');

    makeRequest(createProfileQuery, (err, createResult) => {
      if (err) {
        console.error('   ❌ Error creating profile:', err.message);
        process.exit(1);
      }

      console.log('   Result:', JSON.stringify(createResult, null, 2));
      console.log('');
      console.log('✅ SUCCESS! Profile created successfully!');
      console.log('');
      console.log('🎉 Next steps:');
      console.log('   1. Refresh your browser');
      console.log('   2. Try liking or posting on the timeline again');
      console.log('   3. The foreign key errors should be resolved');
      console.log('');
    });
  });
});
