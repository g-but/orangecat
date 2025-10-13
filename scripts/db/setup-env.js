#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const envVars = {
  // Application Configuration
  'NEXT_PUBLIC_SITE_URL': 'https://orangecat.ch',
  'NEXT_PUBLIC_SITE_NAME': 'OrangeCat',
  'NODE_ENV': 'production',

  // Supabase Configuration
  'NEXT_PUBLIC_SUPABASE_URL': 'your_supabase_url',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'your_supabase_anon_key',

  // Bitcoin Configuration
  'NEXT_PUBLIC_BITCOIN_ADDRESS': 'bitcoin:your_bitcoin_address_here?message=OrangeCat%20Donation',
  'NEXT_PUBLIC_LIGHTNING_ADDRESS': 'your_lightning_address_here',
  'BITCOIN_NETWORK': 'mainnet',

  // Lightning Network Configuration
  'LIGHTNING_NODE_URL': 'your_lightning_node_url',
  'LIGHTNING_MACAROON': 'your_macaroon',
  'LIGHTNING_TLS_CERT': 'your_tls_cert',

  // API Configuration
  'NEXT_PUBLIC_BLOCKCYPHER_API_KEY': 'your_blockcypher_api_key'
};

async function setupVercelEnv() {
  // REMOVED: console.log statement
  
  for (const [key, value] of Object.entries(envVars)) {
    try {
      // REMOVED: console.log statement
      execSync(`vercel env add ${key} production`, {
        input: Buffer.from(`${value}\n`),
        stdio: ['pipe', 'inherit', 'inherit']
      });
      if (process.env.NODE_ENV === 'development') console.log(`✅ ${key} set successfully`);
    } catch (error) {
      console.error(`❌ Failed to set ${key}: ${error.message}`);
    }
  }
  
  // REMOVED: console.log statement
}

setupVercelEnv().catch(console.error); 