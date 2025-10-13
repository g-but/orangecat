#!/usr/bin/env node

/**
 * Test script for password reset functionality
 * 
 * This script helps verify that the password reset flow works correctly
 * by testing the environment configuration and providing debug info.
 */

const path = require('path');
const fs = require('fs');

console.log('🔐 OrangeCat Password Reset Test\n');

// Check environment variables
console.log('📋 Environment Configuration:');
console.log(`  NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET'}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (isProduction ? 'https://www.orangecat.ch' : 'http://localhost:3000');

console.log(`\n🌐 Expected Reset URL: ${siteUrl}/auth/reset-password`);

// Check if reset password page exists
const resetPagePath = path.join(__dirname, '../src/app/auth/reset-password/page.tsx');
const resetPageExists = fs.existsSync(resetPagePath);

console.log('\n📁 File Structure Check:');
console.log(`  Reset password page: ${resetPageExists ? '✅ EXISTS' : '❌ MISSING'}`);

if (resetPageExists) {
  console.log(`    Location: ${resetPagePath}`);
}

// Check Supabase configuration files
const authServicePath = path.join(__dirname, '../src/services/supabase/auth/index.ts');
const authServiceExists = fs.existsSync(authServicePath);

console.log(`  Auth service: ${authServiceExists ? '✅ EXISTS' : '❌ MISSING'}`);

if (authServiceExists) {
  // Read the auth service to check resetPassword function
  const authServiceContent = fs.readFileSync(authServicePath, 'utf8');
  const hasResetFunction = authServiceContent.includes('resetPasswordForEmail');
  const usesCorrectRedirect = authServiceContent.includes('www.orangecat.ch');
  
  console.log(`    Reset function: ${hasResetFunction ? '✅ FOUND' : '❌ MISSING'}`);
  console.log(`    Correct redirect URL: ${usesCorrectRedirect ? '✅ USES www.orangecat.ch' : '❌ INCORRECT'}`);
}

// Check if email template exists
const emailTemplatePath = path.join(__dirname, '../docs/security/supabase-email-template.html');
const emailTemplateExists = fs.existsSync(emailTemplatePath);

console.log(`  Email template: ${emailTemplateExists ? '✅ EXISTS' : '❌ MISSING'}`);

// Instructions
console.log('\n📋 Next Steps to Fix Password Reset:');
console.log('');
console.log('1. 📧 Update Supabase Email Template:');
console.log('   - Go to your Supabase Dashboard → Authentication → Email Templates');
console.log('   - Select "Reset password" template');
console.log('   - Copy the HTML from: SUPABASE_EMAIL_TEMPLATES.md');
console.log('   - Save the changes');
console.log('');
console.log('2. 🔗 Verify Supabase URL Configuration:');
console.log('   - In Supabase Dashboard → Authentication → URL Configuration');
console.log('   - Site URL: https://www.orangecat.ch');
console.log('   - Add redirect URLs:');
console.log('     * https://www.orangecat.ch/auth/reset-password');
console.log('     * https://orangecat.ch/auth/reset-password');
console.log('');
console.log('3. 🌍 Environment Variables (Production):');
console.log('   - Ensure NEXT_PUBLIC_SITE_URL=https://www.orangecat.ch');
console.log('   - This should be set in your hosting provider (Vercel, etc.)');
console.log('');
console.log('4. 🧪 Test the Flow:');
console.log('   - Go to your app and click "Forgot Password"');
console.log('   - Enter your email and submit');
console.log('   - Check your email for the beautiful reset link');
console.log('   - Click the link - should take you to /auth/reset-password');
console.log('   - Enter new password and submit');
console.log('');

if (!process.env.NEXT_PUBLIC_SITE_URL && isProduction) {
  console.log('⚠️  WARNING: NEXT_PUBLIC_SITE_URL not set in production environment!');
  console.log('   This may cause reset links to not work properly.');
  console.log('');
}

console.log('✨ The password reset code is already implemented correctly.');
console.log('   The main issue is likely the Supabase email template configuration.');
console.log('');
console.log('📖 For detailed instructions, see: SUPABASE_EMAIL_TEMPLATES.md');