#!/usr/bin/env node

/**
 * Debug Supabase configuration for password reset
 * 
 * This script helps identify configuration issues that prevent
 * password reset from working properly.
 */

console.log('🔍 Supabase Password Reset Configuration Debugger\n');

// Check environment variables
console.log('🌍 Environment Variables:');
console.log(`  NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL || '❌ NOT SET'}`);
console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ NOT SET'}`);
console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET'}`);

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.orangecat.ch';
const expectedResetUrl = `${siteUrl}/auth/reset-password`;

console.log('\n🔗 Expected Password Reset URLs:');
console.log(`  Code generates: ${expectedResetUrl}`);
console.log(`  Should redirect to: /auth/reset-password`);

console.log('\n❌ Common Issues & Solutions:');

console.log('\n1. 🚨 MOST COMMON: Supabase Redirect URL Mismatch');
console.log('   Problem: Reset link goes to homepage with error params');
console.log('   Solution: In Supabase Dashboard → Authentication → URL Configuration');
console.log('   Add EXACT redirect URLs:');
console.log('   ✅ https://www.orangecat.ch/auth/reset-password');
console.log('   ✅ https://orangecat.ch/auth/reset-password');
console.log('   ✅ https://www.orangecat.ch/**');

console.log('\n2. 🕐 Token Expiration');
console.log('   Problem: Tokens expire after 1 hour by default');
console.log('   Solution: Request new reset if link expired');
console.log('   The error page now shows clear expiration message');

console.log('\n3. 🌐 Site URL Mismatch'); 
console.log('   Problem: Environment NEXT_PUBLIC_SITE_URL doesn\'t match Supabase Site URL');
console.log('   Solution: Both should be: https://www.orangecat.ch');

console.log('\n4. 📧 Email Template Issues');
console.log('   Problem: Using default Supabase template');
console.log('   Solution: Update template in Supabase Dashboard → Authentication → Email Templates');

console.log('\n🧪 Testing Steps:');
console.log('1. Update Supabase redirect URLs (step 1 above)');
console.log('2. Request password reset from your app');
console.log('3. Check email - should have beautiful template');
console.log('4. Click link - should go to /auth/reset-password (not homepage)');
console.log('5. If still goes to homepage, double-check redirect URLs');

console.log('\n🔧 Current Code Improvements:');
console.log('✅ Middleware now redirects reset tokens from / to /auth/reset-password');
console.log('✅ Reset page handles expired token errors properly');  
console.log('✅ Better error messages for different failure scenarios');
console.log('✅ Support for both query params and hash fragments');

console.log('\n📝 Next Actions:');
console.log('1. Open Supabase Dashboard');
console.log('2. Go to Authentication → URL Configuration'); 
console.log('3. Add the exact redirect URLs listed above');
console.log('4. Test the reset flow again');
console.log('5. If still issues, check browser dev tools for redirect chain');

if (!process.env.NEXT_PUBLIC_SITE_URL) {
  console.log('\n⚠️  WARNING: NEXT_PUBLIC_SITE_URL not set!');
  console.log('   Set this in your hosting environment to: https://www.orangecat.ch');
}

console.log('\n🎯 The main issue is almost certainly the Supabase redirect URL configuration.');
console.log('   Once that\'s fixed, the reset flow should work perfectly!');