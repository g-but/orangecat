#!/usr/bin/env node
/**
 * Create "Metal Music" test user
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createMetalMusicUser() {
  const email = 'metal@music.com';
  const password = 'MetalMusic123!';
  const username = 'metal_music';
  const name = 'Metal Music';

  try {
    console.log('🎸 Creating "Metal Music" user...\n');

    // Check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return;
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      console.log('✅ User already exists:', existingUser.id);
      
      // Check profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', existingUser.id)
        .single();

      if (!profile) {
        console.log('🔧 Creating profile...');
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: existingUser.id,
            username,
            name,
            email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('❌ Profile error:', profileError);
        } else {
          console.log('✅ Profile created');
        }
      } else {
        console.log('✅ Profile exists');
      }

      console.log('\n📝 Login credentials:');
      console.log('   Email:', email);
      console.log('   Password:', password);
      return;
    }

    // Create user
    console.log('🔧 Creating new user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, username }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError);
      return;
    }

    console.log('✅ User created:', newUser.user.id);

    // Create profile
    console.log('🔧 Creating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        username,
        name,
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('❌ Profile error:', profileError);
    } else {
      console.log('✅ Profile created');
    }

    console.log('\n🎉 User created successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createMetalMusicUser();
