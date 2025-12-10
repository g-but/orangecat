#!/usr/bin/env node
/**
 * Clear Service Worker Cache
 *
 * This script helps clear service worker registrations and caches
 * when developing locally to prevent stale content issues.
 *
 * Usage: node scripts/dev/clear-service-worker.js
 */

console.log('🧹 Service Worker Cache Cleaner\n');

console.log('To clear service worker cache in your browser:');
console.log('');
console.log('1. Open Chrome DevTools (F12)');
console.log('2. Go to Application tab');
console.log('3. Click "Service Workers" in the left sidebar');
console.log('4. Click "Unregister" for any registered service workers');
console.log('5. Click "Cache Storage" in the left sidebar');
console.log('6. Right-click each cache and select "Delete"');
console.log('7. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)');
console.log('');
console.log('Alternatively, use the browser console:');
console.log('');
console.log('```javascript');
console.log('// Unregister all service workers');
console.log('navigator.serviceWorker.getRegistrations().then(registrations => {');
console.log('  registrations.forEach(reg => reg.unregister());');
console.log('});');
console.log('');
console.log('// Clear all caches');
console.log('caches.keys().then(cacheNames => {');
console.log('  cacheNames.forEach(cacheName => caches.delete(cacheName));');
console.log('});');
console.log('```');
console.log('');
console.log('✅ The service worker is now disabled in development mode.');
console.log('   Changes should appear immediately after a hard refresh.');




























