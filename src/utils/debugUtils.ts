// Store original console methods before they get overridden
const originalConsole = {
  log: console.log.bind(console),
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console)
};

// Function to restore original console methods
export function restoreConsole() {
  if (typeof window !== 'undefined') {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
  }
}

// Function to safely log without browser extension interference
export function safeLog(...args: any[]) {
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
  if (typeof window === 'undefined') return false;
  
  // Check if console.log has been replaced with something else
  return console.log.toString().includes('overrideMethod') || 
         console.log.toString().includes('hook.js') ||
         console.log.toString().length < 50; // Original console.log is quite long
}

// Auto-restore console on import in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Check if console has been overridden and restore it
  if (isConsoleOverridden()) {
    console.warn('Console override detected! Restoring original console...');
    restoreConsole();
  }
} 