// Quick test to verify logger imports
console.log('Testing logger imports...');

try {
  const { logAuth, logProfile, logger } = require('./src/utils/logger.ts');
  
  console.log('✅ logAuth imported successfully:', typeof logAuth);
  console.log('✅ logProfile imported successfully:', typeof logProfile);
  console.log('✅ logger imported successfully:', typeof logger);
  
  // Test the functions
  logAuth('Test auth message');
  logProfile('Test profile message');
  
  console.log('✅ All logger imports working correctly!');
} catch (error) {
  console.error('❌ Logger import error:', error.message);
} 