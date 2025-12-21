#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔑 Supabase API Key Updater');
console.log('===========================');
console.log('');

rl.question('Paste your new Supabase anon public API key: ', (newKey) => {
  // Validate key format
  if (!newKey.startsWith('eyJ') || newKey.split('.').length !== 3) {
    console.log('❌ Invalid key format. Should start with "eyJ" and contain 2 dots.');
    process.exit(1);
  }
  
  // Read current .env.local
  const envPath = '.env.local';
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Create backup
  const backupPath = `${envPath}.backup.${Date.now()}`;
  fs.writeFileSync(backupPath, envContent);
  console.log(`💾 Created backup: ${backupPath}`);
  
  // Update the key
  const keyRegex = /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/;
  if (keyRegex.test(envContent)) {
    envContent = envContent.replace(keyRegex, `NEXT_PUBLIC_SUPABASE_ANON_KEY="${newKey}"`);
    console.log('✅ Updated existing key');
  } else {
    envContent += `\nNEXT_PUBLIC_SUPABASE_ANON_KEY="${newKey}"\n`;
    console.log('✅ Added new key');
  }
  
  // Write back
  fs.writeFileSync(envPath, envContent);
  console.log('🎉 .env.local updated successfully!');
  console.log('');
  console.log('🔄 Restart your dev server: npm run dev');
  
  rl.close();
});
