import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { neutralUsernameFor } from '@/lib/profile/neutral-username';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    // REMOVED: console.log statement

    // Sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: 'butaeff@gmail.com',
      password: process.env.USER_PASSWORD || 'your-password',
    });
    if (signInError) throw signInError;
    if (process.env.NODE_ENV === 'development') console.log('✅ Signed in');

    // Create initial profile
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;

    if (user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        // Never the email local part — see src/lib/profile/neutral-username.ts.
        username: neutralUsernameFor(user.id),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (profileError) throw profileError;
      // REMOVED: console.log statement
    }

    // REMOVED: console.log statement
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
