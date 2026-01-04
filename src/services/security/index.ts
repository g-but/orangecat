/**
 * Security Service - Main Entry Point
 *
 * Orchestrates security operations using modular architecture.
 * This file serves as the main export point for backwards compatibility.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Refactored from 828-line monolith to modular architecture
 */

// Re-export all security modules
export { XSSPrevention } from './xss';
export { SecuritySchemas } from './validation';
export { RateLimiter, type RateLimitConfig } from './rateLimiting';
export { AuthenticationSecurity } from './authentication';
export { SecureErrorHandler } from './errorHandling';
export { SecurityMonitor, type SecurityEvent } from './monitoring';
export { ContentSecurityPolicy } from './csp';
export { SecurityHardening } from './middleware';


