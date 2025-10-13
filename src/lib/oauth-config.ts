/**
 * OAuth Configuration Validation
 *
 * Checks if OAuth providers are properly configured in environment variables.
 * Provides helpful error messages for missing or invalid configurations.
 */

import { logger } from '@/utils/logger'

export type OAuthProvider = 'google' | 'github' | 'twitter' | 'x'

interface OAuthConfig {
  enabled: boolean
  clientId: string | undefined
  clientSecret: string | undefined
}

interface OAuthValidationResult {
  isValid: boolean
  provider: OAuthProvider
  error?: string
}

/**
 * Get OAuth configuration for a provider
 */
function getOAuthConfig(provider: OAuthProvider): OAuthConfig {
  const providerUpper = provider.toUpperCase()
  const clientId = process.env[`SUPABASE_AUTH_EXTERNAL_${providerUpper}_CLIENT_ID`]
  const clientSecret = process.env[`SUPABASE_AUTH_EXTERNAL_${providerUpper}_SECRET`]

  return {
    enabled: !!(clientId && clientSecret && !clientId.startsWith('your-') && !clientSecret.startsWith('your-')),
    clientId,
    clientSecret,
  }
}

/**
 * Validate OAuth provider configuration
 */
export function validateOAuthProvider(provider: OAuthProvider): OAuthValidationResult {
  const config = getOAuthConfig(provider)

  if (!config.clientId || !config.clientSecret) {
    return {
      isValid: false,
      provider,
      error: `${provider} OAuth is not configured. Set SUPABASE_AUTH_EXTERNAL_${provider.toUpperCase()}_CLIENT_ID and SUPABASE_AUTH_EXTERNAL_${provider.toUpperCase()}_SECRET in your .env.local file.`
    }
  }

  // Check for placeholder values
  if (config.clientId.startsWith('your-') || config.clientSecret.startsWith('your-')) {
    return {
      isValid: false,
      provider,
      error: `${provider} OAuth has placeholder values. Replace the placeholder credentials in your .env.local file with real OAuth credentials from ${provider}.`
    }
  }

  return {
    isValid: true,
    provider,
  }
}

/**
 * Check which OAuth providers are configured
 */
export function getConfiguredOAuthProviders(): OAuthProvider[] {
  const providers: OAuthProvider[] = ['google', 'github', 'twitter', 'x']
  const configured: OAuthProvider[] = []

  for (const provider of providers) {
    const result = validateOAuthProvider(provider)
    if (result.isValid) {
      configured.push(provider)
    }
  }

  return configured
}

/**
 * Log OAuth configuration status (development only)
 */
export function logOAuthStatus() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const providers: OAuthProvider[] = ['google', 'github', 'twitter', 'x']
  const status: Record<string, boolean> = {}

  for (const provider of providers) {
    const result = validateOAuthProvider(provider)
    status[provider] = result.isValid

    if (!result.isValid && result.error) {
      logger.debug(`OAuth provider not configured: ${provider}`, { error: result.error }, 'OAuth')
    }
  }

  const configuredCount = Object.values(status).filter(Boolean).length

  if (configuredCount === 0) {
    logger.warn('No OAuth providers configured. Social login will not work.', {
      hint: 'Set up OAuth credentials in .env.local or Supabase dashboard'
    }, 'OAuth')
  } else {
    logger.info(`OAuth providers configured: ${configuredCount}/${providers.length}`, status, 'OAuth')
  }
}

/**
 * Check if a specific provider should be shown in UI
 */
export function shouldShowOAuthProvider(provider: OAuthProvider): boolean {
  // Always show in production (fail gracefully with user-friendly error)
  if (process.env.NODE_ENV === 'production') {
    return true
  }

  // In development, only show if configured
  const result = validateOAuthProvider(provider)
  return result.isValid
}
