/**
 * Verification System for OrangeCat Platform
 * 
 * Handles official account verification, celebrity account protection,
 * and verification badge management to prevent impersonation.
 */

export interface VerificationStatus {
  isVerified: boolean;
  verificationLevel: number;
  verificationBadge?: 'official' | 'verified' | 'creator' | 'celebrity';
  verifiedAt?: Date;
  verifierUserId?: string;
}

export interface CelebrityProtectionResult {
  isProtected: boolean;
  reason?: string;
  suggestedAlternatives?: string[];
}

/**
 * Verification levels:
 * 0 - Unverified
 * 1 - Basic verification (email verified)
 * 2 - Identity verified (documents submitted)
 * 3 - Official account (manually verified by admin)
 * 4 - Celebrity/VIP (special protection status)
 */
export const VERIFICATION_LEVELS = {
  UNVERIFIED: 0,
  BASIC: 1,
  IDENTITY: 2,
  OFFICIAL: 3,
  CELEBRITY: 4
} as const;

/**
 * Protected celebrity and public figure usernames
 * These require special admin approval to claim
 */
export const PROTECTED_USERNAMES = new Set([
  // Bitcoin Legends
  'satoshi', 'satoshinakamoto', 'hal', 'halfinney', 'nickszabo',
  
  // Bitcoin Core Developers
  'gmaxwell', 'sipa', 'petertodd', 'jonasschnelli', 'laanwj',
  'achow101', 'fanquake', 'meshcollider', 'promag', 'ryanofsky',
  'adam3us',
  
  // Lightning Network Developers  
  'roasbeef', 'laolu', 'bitconner', 'cfromknecht', 'halseth',
  'joostjager', 'bhandras', 'wpaulino', 'yyforyongyu',
  
  // Bitcoin Companies (Official)
  'bitcoin', 'bitcoincore', 'bitcoinfoundation', 'blockstream',
  'lightninglabs', 'square', 'cashapp', 'strike', 'river',
  'unchained', 'casa', 'coldcard', 'trezor', 'ledger',
  
  // Prominent Bitcoin Figures
  'aantonop', 'jameson', 'lopp', 'hodlonaut', 'dergigi',
  'saifedean', 'nic', 'carter', 'preston', 'pysh', 'stephan',
  'livera', 'marty', 'bent', 'matt', 'odell', 'knut', 'svanholm',
  
  // Celebrities/Public Figures
  'elonmusk', 'elon', 'jackdorsey', 'jack', 'saylor',
  'michaelsaylor', 'cathie', 'wood', 'naval', 'balaji',
  'tim', 'cook', 'jeff', 'bezos', 'bill', 'gates', 'warren', 'buffett',
  'microsoft', 'apple', 'google', 'meta', 'facebook',
  
  // Government/Institutional
  'fed', 'treasury', 'sec', 'cftc', 'biden', 'trump', 'yellen', 'powell',
  
  // Platform Reserved
  'admin', 'administrator', 'moderator', 'support', 'help',
  'official', 'verified', 'orangecat', 'staff', 'team'
]);

/**
 * Check if a username is protected and requires special verification
 */
export function isProtectedUsername(username: string): CelebrityProtectionResult {
  const lowerUsername = username.toLowerCase();
  
  // First check exact match (case-insensitive)
  if (PROTECTED_USERNAMES.has(lowerUsername)) {
    return {
      isProtected: true,
      reason: 'Celebrity names not allowed - username is protected',
      suggestedAlternatives: generateUsernameAlternatives(username)
    };
  }
  
  // Then check normalized version (removing separators but keeping numbers for usernames like adam3us)
  const normalizedUsername = lowerUsername.replace(/[-_]/g, '');
  if (PROTECTED_USERNAMES.has(normalizedUsername)) {
    return {
      isProtected: true,
      reason: 'Celebrity names not allowed - username is protected',
      suggestedAlternatives: generateUsernameAlternatives(username)
    };
  }
  
  // Check for variations with numbers/separators added to protected names
  for (const protectedName of Array.from(PROTECTED_USERNAMES)) {
    // Check if username starts with protected name + separator/number
    if (lowerUsername.startsWith(protectedName)) {
      const suffix = lowerUsername.slice(protectedName.length);
      // Allow if suffix is clearly not impersonation (like _builder, _fan, etc.)
      if (suffix && /^[_-]?(builder|dev|developer|fan|follower|user|community|unofficial|btc|bitcoin)$/.test(suffix)) {
        continue; // This is a legitimate variation
      }
      // Block if it's just numbers or single characters (like elonmusk1, satoshi_)
      if (suffix && /^[_-]?[0-9]*[_-]?$/.test(suffix)) {
        return {
          isProtected: true,
          reason: `Username too similar to protected name "${protectedName}"`,
          suggestedAlternatives: generateUsernameAlternatives(username)
        };
      }
    }
    
    // Check if protected name can be formed by adding separators (elon_musk -> elonmusk)
    const usernameWithoutSeparators = lowerUsername.replace(/[-_]/g, '');
    if (usernameWithoutSeparators === protectedName) {
      return {
        isProtected: true,
        reason: `Username too similar to protected name "${protectedName}"`,
        suggestedAlternatives: generateUsernameAlternatives(username)
      };
    }
    
    // Special handling for compound names like "elon_musk" -> "elonmusk"
    // Check if username with separators matches any protected compound name
    const compoundVariations = [
      lowerUsername.replace(/[-_]/g, ''),  // elon_musk -> elonmusk
      lowerUsername.replace(/[-_]/g, ' '), // elon_musk -> elon musk (then check if "elonmusk" exists)
    ];
    
    for (const variation of compoundVariations) {
      if (PROTECTED_USERNAMES.has(variation.replace(/\s/g, ''))) {
        return {
          isProtected: true,
          reason: `Username too similar to protected name "${variation.replace(/\s/g, '')}"`,
          suggestedAlternatives: generateUsernameAlternatives(username)
        };
      }
    }
  }
  
  // Check for lookalike variations
  for (const protectedName of Array.from(PROTECTED_USERNAMES)) {
    if (isLookalikeName(lowerUsername, protectedName)) {
      return {
        isProtected: true,
        reason: `Username too similar to protected name "${protectedName}"`,
        suggestedAlternatives: generateUsernameAlternatives(username)
      };
    }
  }
  
  return { isProtected: false };
}

/**
 * Check if two usernames are lookalikes (similarity-based impersonation)
 */
function isLookalikeName(candidate: string, protectedName: string): boolean {
  // Exact match
  if (candidate === protectedName) return true;
  
  // Common character substitutions
  const substitutions: Record<string, string[]> = {
    'o': ['0', 'ο', 'о'], // Latin o, digit 0, Greek omicron, Cyrillic o
    'a': ['@', 'α', 'а'], // Latin a, at symbol, Greek alpha, Cyrillic a
    'e': ['3', 'е'],      // Latin e, digit 3, Cyrillic e
    'i': ['1', 'l', 'і'], // Latin i, digit 1, lowercase L, Cyrillic i
    'u': ['υ', 'и'],      // Latin u, Greek upsilon, Cyrillic n
    's': ['$', '5'],      // Latin s, dollar sign, digit 5
    'g': ['6', '9'],      // Latin g, digits 6 and 9
  };
  
  // Generate variations of the protected name
  const variations = generateNameVariations(protectedName, substitutions);
  
  return variations.includes(candidate);
}

/**
 * Generate common variations of a name for lookalike detection
 */
function generateNameVariations(name: string, substitutions: Record<string, string[]>): string[] {
  const variations = new Set([name]);
  
  // Add single character substitutions
  for (let i = 0; i < name.length; i++) {
    const char = name[i];
    const subs = substitutions[char];
    
    if (subs) {
      for (const sub of subs) {
        const variation = name.slice(0, i) + sub + name.slice(i + 1);
        variations.add(variation);
      }
    }
  }
  
  return Array.from(variations);
}

/**
 * Generate alternative username suggestions
 */
function generateUsernameAlternatives(originalUsername: string): string[] {
  const base = originalUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  return [
    `${base}_dev`,
    `${base}_builder`,
    `${base}_btc`,
    `${base}_fan`,
    `bitcoin_${base}`,
    `${base}_unofficial`,
    `${base}_user`,
    `${base}_community`
  ].slice(0, 5); // Return top 5 suggestions
}

/**
 * Check if user can claim a verification badge
 */
export function canClaimVerificationBadge(
  username: string, 
  currentVerificationLevel: number
): { canClaim: boolean; reason?: string } {
  const protection = isProtectedUsername(username);
  
  if (protection.isProtected) {
    return {
      canClaim: false,
      reason: 'Protected username requires admin verification'
    };
  }
  
  if (currentVerificationLevel < VERIFICATION_LEVELS.IDENTITY) {
    return {
      canClaim: false,
      reason: 'Identity verification required before claiming verification badge'
    };
  }
  
  return { canClaim: true };
}

/**
 * Determine appropriate verification badge type
 */
export function getVerificationBadgeType(
  verificationLevel: number,
  isOfficialAccount: boolean = false
): VerificationStatus['verificationBadge'] | null {
  if (isOfficialAccount || verificationLevel >= VERIFICATION_LEVELS.OFFICIAL) {
    return 'official';
  }
  
  if (verificationLevel >= VERIFICATION_LEVELS.IDENTITY) {
    return 'verified';
  }
  
  if (verificationLevel >= VERIFICATION_LEVELS.BASIC) {
    return 'creator';
  }
  
  return null;
}

/**
 * Validate verification request
 */
export interface VerificationRequest {
  username: string;
  requestedLevel: number;
  documentation?: string[];
  reason?: string;
}

export function validateVerificationRequest(
  request: VerificationRequest
): { valid: boolean; error?: string } {
  const { username, requestedLevel } = request;
  
  // Check if username is available for verification
  const protection = isProtectedUsername(username);
  if (protection.isProtected && requestedLevel >= VERIFICATION_LEVELS.OFFICIAL) {
    return {
      valid: false,
      error: 'Username requires special admin approval for official verification'
    };
  }
  
  // Validate requested level
  if (requestedLevel < VERIFICATION_LEVELS.BASIC || 
      requestedLevel > VERIFICATION_LEVELS.CELEBRITY) {
    return {
      valid: false,
      error: 'Invalid verification level requested'
    };
  }
  
  // High-level verifications require documentation
  if (requestedLevel >= VERIFICATION_LEVELS.IDENTITY && 
      (!request.documentation || request.documentation.length === 0)) {
    return {
      valid: false,
      error: 'Documentation required for identity verification'
    };
  }
  
  return { valid: true };
}

/**
 * Anti-impersonation bio content validation
 */
export function validateBioForImpersonation(bio: string): { valid: boolean; error?: string } {
  if (!bio) return { valid: true };
  
  const lowerBio = bio.toLowerCase();
  
  // Check for verification claims
  const verificationClaims = [
    'verified account', 'official account', 'authentic account',
    'real account', 'legitimate account', 'approved account',
    'certified by', 'endorsed by', 'validated by'
  ];
  
  for (const claim of verificationClaims) {
    if (lowerBio.includes(claim)) {
      return {
        valid: false,
        error: 'Verification claims not allowed in bio'
      };
    }
  }
  
  // Check for celebrity impersonation claims
  const impersonationClaims = [
    'i am', 'this is', 'real', 'actual', 'genuine',
    'not fake', 'authentic', 'original'
  ];
  
  const celebrityNames = Array.from(PROTECTED_USERNAMES);
  
  for (const claim of impersonationClaims) {
    for (const celebrity of celebrityNames) {
      if (lowerBio.includes(`${claim} ${celebrity}`) || 
          lowerBio.includes(`${celebrity} ${claim}`)) {
        return {
          valid: false,
          error: 'Celebrity impersonation claims not allowed'
        };
      }
    }
  }
  
  return { valid: true };
}

/**
 * Get verification badge display properties
 */
export function getVerificationBadgeDisplay(badge: VerificationStatus['verificationBadge']) {
  const badgeConfig = {
    official: {
      icon: '✓',
      color: '#1DA1F2', // Twitter blue
      label: 'Official',
      description: 'This account has been verified as an official representative'
    },
    verified: {
      icon: '✓',
      color: '#10B981', // Green
      label: 'Verified',
      description: 'This account has been verified through identity documentation'
    },
    creator: {
      icon: '⭐',
      color: '#F59E0B', // Amber
      label: 'Creator',
      description: 'This account belongs to a content creator or community member'
    },
    celebrity: {
      icon: '👑',
      color: '#8B5CF6', // Purple
      label: 'Celebrity',
      description: 'This account belongs to a notable public figure'
    }
  };
  
  return badge ? badgeConfig[badge] : null;
} 