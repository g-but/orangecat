import { isProtectedUsername, validateBioForImpersonation } from './verification';

// Enhanced Bitcoin address validation with comprehensive security
export const isValidBitcoinAddress = (address: string): { valid: boolean; error?: string } => {
  if (!address) {
    return { valid: false, error: 'Bitcoin address required' };
  }

  // 1. Prevent testnet addresses on mainnet (check before format validation)
  if (address.startsWith('tb1') || address.startsWith('bcrt1')) {
    return { valid: false, error: 'Testnet addresses not allowed' };
  }

  // 2. Basic format validation
  const formatRegex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,87}$/;
  if (!formatRegex.test(address)) {
    return { valid: false, error: 'Invalid Bitcoin address format' };
  }

  // 3. Prevent known burn addresses
  const burnAddresses = [
    '1111111111111111111114oLvT2',
    '1BitcoinEaterAddressDontSendf59kuE',
    'bc1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9424r'
  ];
  if (burnAddresses.includes(address)) {
    return { valid: false, error: 'Burn addresses not allowed' };
  }

  // 4. Length validation by address type
  if (address.startsWith('bc1')) {
    // Bech32 (SegWit) addresses
    if (address.length < 42 || address.length > 62) {
      return { valid: false, error: 'Invalid bech32 address length' };
    }
  } else if (address.startsWith('3')) {
    // P2SH addresses (SegWit wrapped)
    if (address.length !== 34) {
      return { valid: false, error: 'Invalid P2SH address length' };
    }
  } else if (address.startsWith('1')) {
    // Legacy P2PKH addresses
    if (address.length !== 34) {
      return { valid: false, error: 'Invalid P2PKH address length' };
    }
  }

  return { valid: true };
};

// Enhanced Lightning address validation with security checks
export const isValidLightningAddress = (address: string): { valid: boolean; error?: string } => {
  if (!address) {
    return { valid: false, error: 'Lightning address required' };
  }

  // 1. Prevent local/private addresses (check before format validation)
  const domain = address.split('@')[1];
  if (domain) {
    const forbiddenDomains = ['localhost', '127.0.0.1', '0.0.0.0', '10.', '192.168.', '172.'];
    if (forbiddenDomains.some(forbidden => domain.includes(forbidden))) {
      return { valid: false, error: 'Local addresses not allowed' };
    }
  }

  // 2. Basic format validation
  const formatRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!formatRegex.test(address)) {
    return { valid: false, error: 'Invalid Lightning address format' };
  }

  // 3. Domain length validation
  if (domain && domain.length > 253) {
    return { valid: false, error: 'Domain name too long' };
  }

  // 4. Prevent obviously suspicious domains
  const suspiciousDomains = ['tempmail', 'guerrillamail', '10minutemail', 'throwaway'];
  if (domain && suspiciousDomains.some(suspicious => domain.toLowerCase().includes(suspicious))) {
    return { valid: false, error: 'Temporary email domains not allowed' };
  }

  return { valid: true };
};

// Enhanced username validation with anti-impersonation protection
export const isValidUsername = (username: string): { valid: boolean; error?: string; suggestedAlternatives?: string[] } => {
  if (!username) {
    return { valid: false, error: 'Username required' };
  }

  // 1. Length validation
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' };
  }
  if (username.length > 30) {
    return { valid: false, error: 'Username must be 30 characters or less' };
  }

  // 2. Character validation
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' };
  }

  // 3. Reserved usernames (anti-impersonation)
  const reservedUsernames = [
    'admin', 'administrator', 'root', 'mod', 'moderator', 'support',
    'help', 'api', 'www', 'mail', 'email', 'bitcoin', 'btc', 'satoshi',
    'satoshinakamoto', 'nakamoto', 'bitcoinfoundation', 'bitcoincore',
    'lightning', 'ln', 'official', 'verified', 'staff', 'team',
    'orangecat', 'orange-cat', 'orange_cat'
  ];
  
  if (reservedUsernames.includes(username.toLowerCase())) {
    return { valid: false, error: 'Username is reserved' };
  }

  // 4. Check for protected usernames using the verification system
  const protectionCheck = isProtectedUsername(username);
  if (protectionCheck.isProtected) {
    return { 
      valid: false, 
      error: protectionCheck.reason || 'Username is protected',
      suggestedAlternatives: protectionCheck.suggestedAlternatives
    };
  }

  return { valid: true };
};

// Enhanced bio content validation and sanitization
export const isValidBio = (bio: string): { valid: boolean; error?: string } => {
  if (!bio) {
    return { valid: true }; // Bio is optional
  }

  // 1. Length limits
  if (bio.length > 500) {
    return { valid: false, error: 'Bio must be under 500 characters' };
  }

  // 2. HTML/Script injection prevention
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,  // onclick, onload, etc.
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<link/gi,
    /<meta/gi
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(bio)) {
      return { valid: false, error: 'Bio contains prohibited content' };
    }
  }

  // 3. Prevent alternative Bitcoin address injection
  const btcAddressPattern = /\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}\b/g;
  const foundAddresses = bio.match(btcAddressPattern);
  if (foundAddresses && foundAddresses.length > 0) {
    return { valid: false, error: 'Bitcoin addresses not allowed in bio' };
  }

  // 4. Prevent verification badge spoofing (check before authority terms)
  const verificationSpoof = /(verified|official|certified|authentic).*[✓✔☑]|[✓✔☑].*(verified|official|certified|authentic)/gi;
  if (verificationSpoof.test(bio)) {
    return { valid: false, error: 'Verification claims not allowed' };
  }

  // 5. Prevent authority impersonation
  const authorityTerms = [
    'official bitcoin', 'bitcoin foundation', 'bitcoin core',
    'satoshi nakamoto', 'bitcoin developer', 'core developer', 
    'lightning labs', 'blockstream', 'bitcoin.org'
  ];

  const bioLower = bio.toLowerCase();
  for (const term of authorityTerms) {
    if (bioLower.includes(term)) {
      return { valid: false, error: 'Authority claims not allowed in bio' };
    }
  }

  // 6. Use verification system for additional impersonation checks
  const impersonationCheck = validateBioForImpersonation(bio);
  if (!impersonationCheck.valid) {
    return impersonationCheck;
  }

  return { valid: true };
};

// Client-side sanitization for bio display (additional security layer)
export const sanitizeBioForDisplay = (bio: string): string => {
  if (!bio) return '';
  
  return bio
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Legacy compatibility functions (maintain existing API)
export const isValidBitcoinAddressLegacy = (address: string): boolean => {
  const result = isValidBitcoinAddress(address);
  return result.valid;
};

export const isValidLightningAddressLegacy = (address: string): boolean => {
  const result = isValidLightningAddress(address);
  return result.valid;
};

// URL validation utilities for seamless user experience

export function normalizeUrl(url: string): string {
  if (!url.trim()) return ''
  
  let normalized = url.trim()
  
  // Remove any surrounding quotes or spaces
  normalized = normalized.replace(/^["'\s]+|["'\s]+$/g, '')
  
  // If it doesn't start with a protocol, add https://
  if (normalized && !normalized.match(/^https?:\/\//i)) {
    normalized = `https://${normalized}`
  }
  
  return normalized
}

export function validateUrl(url: string): { isValid: boolean; normalized: string; error?: string } {
  if (!url.trim()) {
    return { isValid: true, normalized: '' } // Empty is valid (optional field)
  }
  
  const normalized = normalizeUrl(url)
  
  try {
    const urlObj = new URL(normalized)
    
    // Check if it's a valid HTTP/HTTPS URL
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        normalized,
        error: 'URL must use http:// or https://'
      }
    }
    
    // Check if hostname exists
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      return {
        isValid: false,
        normalized,
        error: 'Please enter a valid domain name'
      }
    }
    
    return { isValid: true, normalized }
  } catch (error) {
    return {
      isValid: false,
      normalized,
      error: 'Please enter a valid URL'
    }
  }
}

export function isValidUrl(url: string): boolean {
  return validateUrl(url).isValid
} 