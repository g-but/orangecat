/**
 * API Key Management Service
 *
 * Handles BYOK (Bring Your Own Key) functionality:
 * - Encrypt/decrypt API keys
 * - CRUD operations
 * - Key validation with OpenRouter
 * - Platform usage tracking
 *
 * Created: 2026-01-08
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Type alias for any SupabaseClient (accepts any database schema)
type AnySupabaseClient = SupabaseClient<any, any, any>;
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// ==================== TYPES ====================

export interface UserApiKey {
  id: string;
  user_id: string;
  provider: string;
  key_name: string;
  key_hint: string;
  is_valid: boolean;
  is_primary: boolean;
  last_validated_at: string | null;
  last_used_at: string | null;
  total_requests: number;
  total_tokens_used: number;
  created_at: string;
  updated_at: string;
}

export interface PlatformUsage {
  daily_requests: number;
  daily_limit: number;
  requests_remaining: number;
  can_use_platform: boolean;
}

export interface KeyValidationResult {
  isValid: boolean;
  error?: string;
  rateLimits?: {
    requestsRemaining: number;
    requestsLimit: number;
  };
}

// ==================== ENCRYPTION ====================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Get encryption key from environment
 * Must be set in all environments - there is no safe fallback for encryption keys
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    // No fallback - encryption keys must be properly configured
    // In development, add API_KEY_ENCRYPTION_SECRET to .env.local
    throw new Error(
      'API_KEY_ENCRYPTION_SECRET environment variable is required. ' +
        'Generate a secure key with: openssl rand -base64 32'
    );
  }
  return scryptSync(secret, 'orangecat-api-keys', 32);
}

/**
 * Encrypt an API key
 */
export function encryptApiKey(plainKey: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an API key
 */
export function decryptApiKey(encryptedKey: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encrypted] = encryptedKey.split(':');

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted key format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate key hint (last 4 characters)
 */
export function generateKeyHint(apiKey: string): string {
  if (apiKey.length < 8) {
    return '****';
  }
  return `...${apiKey.slice(-4)}`;
}

// ==================== SERVICE CLASS ====================

export class ApiKeyService {
  constructor(private supabase: AnySupabaseClient) {}

  /**
   * Add a new API key for a user
   */
  async addKey(params: {
    userId: string;
    provider: string;
    keyName: string;
    apiKey: string;
    isPrimary?: boolean;
  }): Promise<{ success: boolean; key?: UserApiKey; error?: string }> {
    const { userId, provider, keyName, apiKey, isPrimary = false } = params;

    // Validate the key with OpenRouter first
    const validation = await this.validateKeyWithProvider(apiKey);
    if (!validation.isValid) {
      return { success: false, error: validation.error || 'Invalid API key' };
    }

    // Encrypt the key
    const encryptedKey = encryptApiKey(apiKey);
    const keyHint = generateKeyHint(apiKey);

    // Store in database
    const { data, error } = await this.supabase
      .from('user_api_keys')
      .insert({
        user_id: userId,
        provider,
        key_name: keyName,
        encrypted_key: encryptedKey,
        key_hint: keyHint,
        is_valid: true,
        is_primary: isPrimary,
        last_validated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A key with this name already exists' };
      }
      return { success: false, error: error.message };
    }

    // Don't return encrypted_key to client
    const safeKey = { ...data, encrypted_key: undefined } as UserApiKey;
    return { success: true, key: safeKey };
  }

  /**
   * Get all API keys for a user (without encrypted values)
   */
  async getKeys(userId: string): Promise<UserApiKey[]> {
    const { data, error } = await this.supabase
      .from('user_api_keys')
      .select(
        'id, user_id, provider, key_name, key_hint, is_valid, is_primary, last_validated_at, last_used_at, total_requests, total_tokens_used, created_at, updated_at'
      )
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get the decrypted API key for a user (internal use only)
   */
  async getDecryptedKey(userId: string, provider: string = 'openrouter'): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_valid', true)
      .eq('is_primary', true)
      .single();

    if (error || !data?.encrypted_key) {
      return null;
    }

    try {
      return decryptApiKey(data.encrypted_key);
    } catch {
      console.error('Failed to decrypt API key');
      return null;
    }
  }

  /**
   * Set a key as primary
   */
  async setPrimary(userId: string, keyId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_api_keys')
      .update({ is_primary: true })
      .eq('id', keyId)
      .eq('user_id', userId);

    return !error;
  }

  /**
   * Delete an API key
   */
  async deleteKey(userId: string, keyId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', userId);

    return !error;
  }

  /**
   * Update key usage stats
   */
  async updateKeyUsage(keyId: string, tokensUsed: number = 0): Promise<void> {
    await this.supabase.rpc('update_key_usage', {
      p_key_id: keyId,
      p_tokens_used: tokensUsed,
    });
  }

  /**
   * Check if user has a valid BYOK
   */
  async hasValidKey(userId: string, provider: string = 'openrouter'): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('user_api_keys')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_valid', true)
      .limit(1)
      .single();

    return !error && !!data;
  }

  /**
   * Validate an API key with OpenRouter
   */
  async validateKeyWithProvider(apiKey: string): Promise<KeyValidationResult> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { isValid: false, error: 'Invalid API key' };
        }
        return { isValid: false, error: `Validation failed: ${response.status}` };
      }

      const data = await response.json();
      return {
        isValid: true,
        rateLimits: {
          requestsRemaining: data.data?.rate_limit?.requests_remaining || 0,
          requestsLimit: data.data?.rate_limit?.requests_limit || 0,
        },
      };
    } catch {
      return { isValid: false, error: 'Failed to validate key' };
    }
  }

  // ==================== PLATFORM USAGE ====================

  /**
   * Check platform usage limits for a user
   */
  async checkPlatformUsage(userId: string): Promise<PlatformUsage> {
    const { data, error } = await this.supabase.rpc('check_platform_limit', { p_user_id: userId });

    if (error || !data || data.length === 0) {
      // Default if no usage record exists
      return {
        daily_requests: 0,
        daily_limit: 10,
        requests_remaining: 10,
        can_use_platform: true,
      };
    }

    return data[0];
  }

  /**
   * Increment platform usage
   */
  async incrementPlatformUsage(
    userId: string,
    requestCount: number = 1,
    tokenCount: number = 0
  ): Promise<{ limitReached: boolean }> {
    const { data, error } = await this.supabase.rpc('increment_platform_usage', {
      p_user_id: userId,
      p_request_count: requestCount,
      p_token_count: tokenCount,
    });

    if (error) {
      console.error('Error incrementing platform usage:', error);
      return { limitReached: false };
    }

    return { limitReached: data?.[0]?.limit_reached || false };
  }
}

// ==================== FACTORY ====================

export function createApiKeyService(supabase: AnySupabaseClient): ApiKeyService {
  return new ApiKeyService(supabase);
}
