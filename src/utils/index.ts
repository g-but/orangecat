// Utils index file for organizing utility exports
// This provides a single point of entry for utility functions

// Re-export the consolidated cn function from lib/utils
export { cn } from '@/lib/utils';

// Individual utility modules can be imported directly:
// import { convert, formatCurrency } from '@/services/currency'  // Currency utilities (consolidated)
// import { validateEmail } from '@/utils/validation'
// import { generateBitcoinAddress } from '@/utils/bitcoin'
// etc.

// This index is primarily for the cn function consolidation
// Other utilities should be imported directly to avoid conflicts

// Note: functions.ts is reserved for additional general utilities
