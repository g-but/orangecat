// Test service creation with real authentication
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// This would need to be run in the browser context to get the real session
async function testServiceCreationWithAuth() {
  console.log('🧪 Testing service creation with authentication...');

  // In browser context, this would get the real session
  // For now, we'll test the API endpoint directly
  const serviceData = {
    title: 'Test Service with Auth',
    description: 'Testing service creation with proper authentication',
    category: 'Consulting',
    hourly_rate_sats: 5000,
    currency: 'SATS',
    duration_minutes: 60,
    service_location_type: 'remote'
  };

  console.log('📤 Making API call to /api/services...');

  try {
    // This would need to be run in browser context with proper auth headers
    const response = await fetch('http://localhost:3003/api/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Auth headers would be set automatically by browser
      },
      body: JSON.stringify(serviceData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Service created successfully:', result);
    } else {
      console.log('❌ Service creation failed:', response.status, result);
    }
  } catch (error) {
    console.error('❌ Error making API call:', error);
  }
}

console.log('This script needs to be run in browser context with authentication.');
console.log('The 403 error suggests server-side authentication is not working properly.');
console.log('Check if cookies are being passed correctly from browser to server.');











