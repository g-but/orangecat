import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  try {
    console.log('Setting up database...')

    // Sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: 'butaeff@gmail.com',
      password: process.env.USER_PASSWORD || 'your-password'
    })
    if (signInError) throw signInError
    console.log('✅ Signed in')

    // Create initial profile
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: user.email?.split('@')[0] || 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      if (profileError) throw profileError
      console.log('✅ Initial profile created')
    }

    console.log('🎉 Database setup complete!')
  } catch (error) {
    console.error('Error setting up database:', error)
    process.exit(1)
  }
}

setupDatabase() 