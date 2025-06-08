#!/usr/bin/env node

/**
 * Get Current Date and Time
 * 
 * This script provides the current date and time in various formats.
 * It can be used to ensure consistent date/time usage across the project.
 * 
 * Created: June 5, 2025
 * Last Modified: June 5, 2025
 * Last Modified Summary: Initial creation
 */

const now = new Date();

// ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
const iso = now.toISOString();

// Date only (YYYY-MM-DD)
const dateOnly = now.toISOString().split('T')[0];

// Time only (HH:mm:ss)
const timeOnly = now.toTimeString().split(' ')[0];

// Full date and time (YYYY-MM-DD HH:mm:ss)
const fullDateTime = `${dateOnly} ${timeOnly}`;

// Unix timestamp
const unixTimestamp = Math.floor(now.getTime() / 1000);

// Output all formats
console.log('Current Date and Time:');
console.log('---------------------');
console.log(`ISO Format: ${iso}`);
console.log(`Date Only: ${dateOnly}`);
console.log(`Time Only: ${timeOnly}`);
console.log(`Full DateTime: ${fullDateTime}`);
console.log(`Unix Timestamp: ${unixTimestamp}`);

// Export the values for use in other scripts
module.exports = {
    iso,
    dateOnly,
    timeOnly,
    fullDateTime,
    unixTimestamp,
    raw: now
}; 