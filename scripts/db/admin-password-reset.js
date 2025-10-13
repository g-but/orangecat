const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function resetUserPassword(email, newPassword) {
  // Check if we have the required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.error('   - SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return false
  }

  // Initialize Supabase with service role key for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // This allows admin operations
  )

  try {
    console.log(`🔧 Finding user: ${email}`)
    
    // First, find the user by email
    const { data: users, error: findError } = await supabase.auth.admin.listUsers()
    
    if (findError) {
      console.error('❌ Error finding user:', findError.message)
      return false
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      console.error(`❌ User not found: ${email}`)
      return false
    }

    console.log(`✅ Found user ID: ${user.id}`)
    console.log(`🔧 Resetting password for user: ${email}`)
    
    // Update user password using admin API
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (error) {
      console.error('❌ Error resetting password:', error.message)
      return false
    }

    console.log('✅ Password reset successfully!')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 New password: ${newPassword}`)
    console.log(`🆔 User ID: ${user.id}`)
    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return false
  }
}

// Get email from command line argument
const email = process.argv[2]
const newPassword = process.argv[3] || 'TempPassword123!'

if (!email) {
  console.log('Usage: node scripts/admin-password-reset.js <email> [password]')
  console.log('Example: node scripts/admin-password-reset.js user@example.com NewPassword123!')
  process.exit(1)
}

resetUserPassword(email, newPassword) 