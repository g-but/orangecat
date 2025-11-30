/**
 * Social Media Platforms Configuration
 *
 * Single source of truth for predefined social media platforms.
 * Easy to extend: Just add a new entry to SOCIAL_PLATFORMS array.
 *
 * Created: 2025-11-24
 * Last Modified: 2025-11-24
 * Last Modified Summary: Initial configuration with common platforms
 */

import {
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  Github,
  Youtube,
  MessageCircle,
  Globe,
  Heart,
} from 'lucide-react';

export type SocialPlatformId =
  | 'x'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'github'
  | 'nostr'
  | 'telegram'
  | 'youtube'
  | 'patreon'
  | 'custom';

export interface SocialPlatform {
  id: SocialPlatformId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  validation?: (value: string) => { valid: boolean; error?: string };
  formatHint?: string;
}

/**
 * Predefined social media platforms
 *
 * To add a new platform:
 * 1. Add the platform ID to SocialPlatformId type
 * 2. Add entry to SOCIAL_PLATFORMS array below
 * 3. Add icon import if needed
 *
 * Platforms NOT in this list can still be added via "Custom" option.
 */
export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'x',
    label: 'X (Twitter)',
    icon: Twitter,
    placeholder: '@username or https://x.com/username',
    validation: value => {
      if (!value.trim()) {
        return { valid: false, error: 'Value is required' };
      }
      // Accept @username or full URL
      const isValid = /^@[\w]+$/.test(value) || /^https?:\/\/(x\.com|twitter\.com)\//.test(value);
      return {
        valid: isValid,
        error: isValid ? undefined : 'Enter @username or full URL (e.g., https://x.com/username)',
      };
    },
    formatHint: 'Enter @username or full URL',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    placeholder: '@username or https://instagram.com/username',
    validation: value => {
      if (!value.trim()) {
        return { valid: false, error: 'Value is required' };
      }
      const isValid = /^@[\w.]+$/.test(value) || /^https?:\/\/(www\.)?instagram\.com\//.test(value);
      return {
        valid: isValid,
        error: isValid ? undefined : 'Enter @username or full URL',
      };
    },
    formatHint: 'Enter @username or full URL',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    placeholder: 'username or https://facebook.com/username',
    validation: value => {
      if (!value.trim()) {
        return { valid: false, error: 'Value is required' };
      }
      const isValid = /^[\w.]+$/.test(value) || /^https?:\/\/(www\.)?facebook\.com\//.test(value);
      return {
        valid: isValid,
        error: isValid ? undefined : 'Enter username or full URL',
      };
    },
    formatHint: 'Enter username or full URL',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: Linkedin,
    placeholder: 'https://linkedin.com/in/username',
    validation: value => {
      if (!value.trim()) {
        return { valid: false, error: 'Value is required' };
      }
      const isValid = /^https?:\/\/(www\.)?linkedin\.com\//.test(value);
      return {
        valid: isValid,
        error: isValid ? undefined : 'Enter full LinkedIn profile URL',
      };
    },
    formatHint: 'Enter full profile URL (e.g., https://linkedin.com/in/username)',
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: Github,
    placeholder: 'username or https://github.com/username',
    validation: value => {
      if (!value.trim()) {
        return { valid: false, error: 'Value is required' };
      }
      const isValid = /^[\w-]+$/.test(value) || /^https?:\/\/(www\.)?github\.com\//.test(value);
      return {
        valid: isValid,
        error: isValid ? undefined : 'Enter username or full URL',
      };
    },
    formatHint: 'Enter username or full URL',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    placeholder: 'Channel name or https://youtube.com/@channel',
    validation: value => {
      if (!value.trim()) {
        return { valid: false, error: 'Value is required' };
      }
      const isValid =
        /^[\w\s-]+$/.test(value) || /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(value);
      return {
        valid: isValid,
        error: isValid ? undefined : 'Enter channel name or full URL',
      };
    },
    formatHint: 'Enter channel name or full URL',
  },
  {
    id: 'patreon',
    label: 'Patreon',
    icon: Heart,
    placeholder: 'https://patreon.com/username',
    validation: value => {
      if (!value.trim()) {
        return { valid: false, error: 'Value is required' };
      }
      const isValid = /^https?:\/\/(www\.)?patreon\.com\//.test(value);
      return {
        valid: isValid,
        error: isValid ? undefined : 'Enter full Patreon URL',
      };
    },
    formatHint: 'Enter full Patreon URL',
  },
  {
    id: 'nostr',
    label: 'Nostr',
    icon: Globe,
    placeholder: 'npub1... or nostr profile URL',
    validation: value => {
      if (!value.trim()) {
        return { valid: false, error: 'Value is required' };
      }
      const isValid = /^npub1[a-z0-9]+$/.test(value) || /^https?:\/\//.test(value);
      return {
        valid: isValid,
        error: isValid ? undefined : 'Enter npub key or profile URL',
      };
    },
    formatHint: 'Enter npub key (npub1...) or profile URL',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    icon: MessageCircle,
    placeholder: '@username',
    validation: value => {
      if (!value.trim()) {
        return { valid: false, error: 'Value is required' };
      }
      const isValid = /^@[\w]+$/.test(value);
      return {
        valid: isValid,
        error: isValid ? undefined : 'Enter @username',
      };
    },
    formatHint: 'Enter @username',
  },
  {
    id: 'custom',
    label: 'Custom',
    icon: Globe,
    placeholder: 'Platform name',
    // Custom validation happens in component (requires both label and URL)
  },
];

/**
 * Get platform by ID
 */
export function getPlatformById(id: SocialPlatformId): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find(p => p.id === id);
}

/**
 * Get all predefined platforms (excluding custom)
 */
export function getPredefinedPlatforms(): SocialPlatform[] {
  return SOCIAL_PLATFORMS.filter(p => p.id !== 'custom');
}

/**
 * Check if platform is predefined
 */
export function isPredefinedPlatform(id: SocialPlatformId): boolean {
  return id !== 'custom';
}
