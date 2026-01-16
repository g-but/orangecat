// Store original console methods before they get overridden
const originalConsole = {
  // eslint-disable-next-line no-console
  log: console.log.bind(console),
  // eslint-disable-next-line no-console
  error: console.error.bind(console),
  // eslint-disable-next-line no-console
  warn: console.warn.bind(console),
  // eslint-disable-next-line no-console
  info: console.info.bind(console),
  // eslint-disable-next-line no-console
  debug: console.debug.bind(console)
};

// Function to restore original console methods
export function restoreConsole() {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log = originalConsole.log;
    // eslint-disable-next-line no-console
    console.error = originalConsole.error;
    // eslint-disable-next-line no-console
    console.warn = originalConsole.warn;
    // eslint-disable-next-line no-console
    console.info = originalConsole.info;
    // eslint-disable-next-line no-console
    console.debug = originalConsole.debug;
  }
}

// Function to safely log without browser extension interference
import type { EventHandlerArgs } from '@/types/common'
import { logger } from './logger'

export function safeLog(...args: EventHandlerArgs) {
  if (typeof window !== 'undefined') {
    // Try to use the original console method
    try {
      originalConsole.log(...args);
    } catch {
      // Fallback to creating a visual log
      const logDiv = document.createElement('div');
      logDiv.style.cssText = `
        position: fixed; 
        top: 10px; 
        left: 10px; 
        background: black; 
        color: lime; 
        padding: 5px; 
        font-family: monospace; 
        font-size: 12px; 
        z-index: 10000;
        max-width: 500px;
        word-wrap: break-word;
      `;
      logDiv.textContent = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      document.body.appendChild(logDiv);
      
      // Remove after 5 seconds
      setTimeout(() => {
        document.body.removeChild(logDiv);
      }, 5000);
    }
  }
}

// Function to check if console has been overridden
export function isConsoleOverridden(): boolean {
  if (typeof window === 'undefined') {return false;}

  // Check if console.log has been replaced with something else
  // eslint-disable-next-line no-console
  return console.log.toString().includes('overrideMethod') ||
         // eslint-disable-next-line no-console
         console.log.toString().includes('hook.js') ||
         // eslint-disable-next-line no-console
         console.log.toString().length < 50; // Original console.log is quite long
}

// Auto-restore console on import in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Check if console has been overridden and restore it
  if (isConsoleOverridden()) {
    logger.warn('Console override detected! Restoring original console...', undefined, 'DebugUtils');
    restoreConsole();
  }
} 