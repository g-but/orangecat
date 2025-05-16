/**
 * Auth cleanup utility script
 * Used to ensure thorough cleanup of auth data
 */

(function() {
  // Helper to clear cookies by name pattern
  function deleteCookiesByPattern(pattern) {
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      if (pattern.test(name)) {
        // Delete the cookie by setting expired date - use multiple paths to be thorough
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.' + window.location.hostname;
        console.log('Deleted cookie:', name);
      }
    }
  }
  
  // Helper to clear localStorage by key pattern
  function clearStorageByPattern(storage, pattern) {
    try {
      Object.keys(storage).forEach(key => {
        if (pattern.test(key)) {
          storage.removeItem(key);
          console.log('Deleted from storage:', key);
        }
      });
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
  }
  
  // Run cleanup on specific paths or when signout parameter is present
  function runCleanup() {
    console.log('Auth cleanup triggered');
    
    // Clear Supabase cookies
    deleteCookiesByPattern(/^sb-|supabase|auth|token/i);
    
    // Clear local and session storage items
    try {
      clearStorageByPattern(localStorage, /^sb-|supabase|auth|token|session|user/i);
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    
    try {
      clearStorageByPattern(sessionStorage, /^sb-|supabase|auth|token|session|user|orangecat-auth/i);
    } catch (e) {
      console.error('Error clearing sessionStorage:', e);
    }
    
    // Call our API to clear cookies server-side as well
    fetch('/api/auth/clear-cookies', { 
      credentials: 'include',
      cache: 'no-store'
    })
    .then(res => res.json())
    .then(data => {
      console.log('Server-side cookie cleanup result:', data);
      
      // Redirect to home if on signout page
      if (window.location.pathname === '/auth/signout') {
        window.location.href = '/';
      }
    })
    .catch(err => {
      console.error('Error in server-side cookie cleanup:', err);
      
      // Still try to redirect
      if (window.location.pathname === '/auth/signout') {
        window.location.href = '/';
      }
    });
  }
  
  // Check if on sign-out related path
  const onSignoutPath = window.location.pathname === '/auth/signout' || 
                      window.location.pathname === '/signout' || 
                      window.location.search.includes('signout=true');
  
  // Execute immediately if on signout path
  if (onSignoutPath) {
    runCleanup();
  }
  
  // Also run on load to ensure it runs after navigation
  window.addEventListener('load', function() {
    if (onSignoutPath) {
      runCleanup();
    }
  });
})(); 