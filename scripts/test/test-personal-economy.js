#!/usr/bin/env node

/**
 * Quick Test Script for Personal Economy Features
 * Run this after applying the database migration
 */

const BASE_URL = 'http://localhost:3002';

async function testEndpoint(url, description) {
  try {
    console.log(`🔍 Testing: ${description}`);
    const response = await fetch(url);
    const status = response.status;
    console.log(`   Status: ${status}`);

    if (status === 200) {
      console.log(`   ✅ ${description} - OK`);
      return true;
    } else {
      console.log(`   ❌ ${description} - Failed (${status})`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ${description} - Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing Personal Economy Features\n');
  console.log('Make sure:');
  console.log('1. Database migration has been applied');
  console.log('2. Dev server is running on port 3000');
  console.log('3. You are logged in to the app\n');

  const tests = [
    { url: `${BASE_URL}/api/products`, description: 'Products API' },
    { url: `${BASE_URL}/api/services`, description: 'Services API' },
    { url: `${BASE_URL}/api/causes`, description: 'Causes API' },
    { url: `${BASE_URL}/api/ai-assistants`, description: 'AI Assistants API' },
    { url: `${BASE_URL}/dashboard/store`, description: 'My Store Page' },
    { url: `${BASE_URL}/dashboard/services`, description: 'My Services Page' },
    { url: `${BASE_URL}/dashboard/causes`, description: 'My Causes Page' },
    { url: `${BASE_URL}/dashboard/cat`, description: 'My Cat Page' },
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    const success = await testEndpoint(test.url, test.description);
    if (success) passed++;
    console.log(''); // Empty line between tests
  }

  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}/${total}`);
  console.log(`   ❌ Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 All tests passed! Personal Economy features are ready!');
    console.log('\n📋 Manual Testing Checklist:');
    console.log('   □ Visit /dashboard and check sidebar shows Personal Economy cards');
    console.log('   □ Click "My Store" → "Add Product" → Fill form → Create');
    console.log('   □ Click "My Services" → "Add Service" → Fill form → Create');
    console.log('   □ Click "My Causes" → "Add Cause" → Fill form → Create');
    console.log('   □ Click "My Cat" → Check coming soon page and email signup');
    console.log('   □ Test mobile view (sidebar should be equally rich)');
    console.log('   □ Verify navigation menu includes new sections');
  } else {
    console.log('\n⚠️  Some tests failed. Check the issues above.');
  }
}

runTests().catch(console.error);

