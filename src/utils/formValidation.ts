/**
 * Reusable form validation utilities
 * Consolidates validation logic from API routes and components
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

export interface ValidationOptions {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  customValidator?: (value: string) => boolean
}

/**
 * Generic field validator
 */
export function validateField(
  value: string | undefined | null,
  fieldName: string,
  options: ValidationOptions = {}
): ValidationResult {
  const {
    required = false,
    minLength,
    maxLength,
    pattern,
    customValidator
  } = options

  // Required check
  if (required && (!value || value.trim().length === 0)) {
    return {
      valid: false,
      error: `${fieldName} is required`
    }
  }

  // If not required and empty, it's valid
  if (!value || value.trim().length === 0) {
    return { valid: true }
  }

  const trimmedValue = value.trim()

  // Length checks
  if (minLength && trimmedValue.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${minLength} characters`
    }
  }

  if (maxLength && trimmedValue.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must be no more than ${maxLength} characters`
    }
  }

  // Pattern check
  if (pattern && !pattern.test(trimmedValue)) {
    return {
      valid: false,
      error: `${fieldName} format is invalid`
    }
  }

  // Custom validator
  if (customValidator && !customValidator(trimmedValue)) {
    return {
      valid: false,
      error: `${fieldName} is invalid`
    }
  }

  return { valid: true }
}

/**
 * Username validation
 */
export function isValidUsername(username: string | undefined | null): ValidationResult {
  return validateField(username, 'Username', {
    required: true,
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_-]+$/,
    customValidator: (value) => {
      // No consecutive special characters
      if (/[_-]{2,}/.test(value)) {return false}
      // Must start and end with alphanumeric
      if (!/^[a-zA-Z0-9].*[a-zA-Z0-9]$/.test(value)) {return false}
      return true
    }
  })
}

/**
 * Display name validation
 */
export function isValidDisplayName(displayName: string | undefined | null): ValidationResult {
  return validateField(displayName, 'Display name', {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-'.]+$/
  })
}

/**
 * Email validation
 */
export function isValidEmail(email: string | undefined | null): ValidationResult {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return validateField(email, 'Email', {
    required: true,
    pattern: emailPattern,
    customValidator: (value) => {
      // Additional email validation
      if (value.length > 254) {return false}
      const [localPart, domain] = value.split('@')
      if (localPart.length > 64) {return false}
      if (domain.length > 253) {return false}
      return true
    }
  })
}

/**
 * Bitcoin address validation
 */
export function isValidBitcoinAddress(address: string | undefined | null): ValidationResult {
  return validateField(address, 'Bitcoin address', {
    required: false,
    minLength: 26,
    maxLength: 62,
    pattern: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
    customValidator: (value) => {
      // Basic checksum validation could be added here
      return true
    }
  })
}

/**
 * Bio validation
 */
export function isValidBio(bio: string | undefined | null): ValidationResult {
  return validateField(bio, 'Bio', {
    required: false,
    maxLength: 500,
    customValidator: (value) => {
      // Check for excessive line breaks
      if (/\n{4,}/.test(value)) {return false}
      return true
    }
  })
}

/**
 * URL validation
 */
export function isValidUrl(url: string | undefined | null): ValidationResult {
  if (!url || url.trim().length === 0) {
    return { valid: true } // Optional field
  }

  try {
    const urlObj = new URL(url)
    // Only allow http/https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        valid: false,
        error: 'URL must use HTTP or HTTPS protocol'
      }
    }
    return { valid: true }
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format'
    }
  }
}

/**
 * Validate multiple fields and return all errors
 */
export function validateFields(
  fields: Record<string, { value: string | undefined | null; validator: (value: string | undefined | null) => ValidationResult }>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  let valid = true

  for (const [fieldName, { value, validator }] of Object.entries(fields)) {
    const result = validator(value)
    if (!result.valid && result.error) {
      errors[fieldName] = result.error
      valid = false
    }
  }

  return { valid, errors }
}

/**
 * Express middleware for API route validation
 */
export function createValidationMiddleware(
  validationSchema: Record<string, (value: any) => ValidationResult>
) {
  return (data: Record<string, any>) => {
    const errors: Record<string, string> = {}
    let valid = true

    for (const [field, validator] of Object.entries(validationSchema)) {
      const result = validator(data[field])
      if (!result.valid && result.error) {
        errors[field] = result.error
        valid = false
      }
    }

    return { valid, errors }
  }
}

/**
 * Common validation schemas
 */
export const profileValidationSchema = {
  username: isValidUsername,
  name: isValidDisplayName,
  bio: isValidBio,
  bitcoin_address: isValidBitcoinAddress,
  avatar_url: isValidUrl
}

export const authValidationSchema = {
  email: isValidEmail
}