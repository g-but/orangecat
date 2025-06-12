// Global polyfills for server-side rendering compatibility
if (typeof globalThis === 'undefined') {
  // Fallback for older environments
  (function() {
    if (typeof global !== 'undefined') {
      global.globalThis = global;
    } else if (typeof window !== 'undefined') {
      window.globalThis = window;
    } else if (typeof self !== 'undefined') {
      self.globalThis = self;
    } else {
      throw new Error('Unable to locate global object');
    }
  })();
}

// Define self if it doesn't exist
if (typeof self === 'undefined') {
  globalThis.self = globalThis;
}

// Define global if it doesn't exist
if (typeof global === 'undefined') {
  globalThis.global = globalThis;
}

// Define window for server-side compatibility
if (typeof window === 'undefined' && typeof globalThis !== 'undefined') {
  globalThis.window = globalThis;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {};
}

if (typeof exports !== 'undefined') {
  exports.polyfills = true;
} 