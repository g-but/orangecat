const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!');
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

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error:', listError);
      return;
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      console.log('✅ User exists:', existingUser.id);
      console.log('\n📝 Login credentials:');
      console.log('   Email:', email);
      console.log('   Password:', password);
      return;
    }

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, username }
    });

    if (createError) {
      console.error('❌ Error:', createError);
      return;
    }

    console.log('✅ User created:', newUser.user.id);

    const { error: profileError } = await supabase.from('profiles').insert({
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

    console.log('\n🎉 Success!');
    console.log('📝 Login credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createMetalMusicUser();
