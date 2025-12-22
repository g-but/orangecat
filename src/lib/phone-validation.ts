/**
 * Phone Number Validation and Normalization
 *
 * Handles multiple phone number formats, especially Swiss formats:
 * - 0783226939 (local format)
 * - +41-78-322693 (international with separators)
 * - +41 78 322 69 39 (international with spaces)
 *
 * Normalizes to E.164 format: +41783226939
 */

/**
 * Normalize phone number to E.164 format (+[country code][number])
 * Handles Swiss phone numbers and common international formats
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters except +
  let cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');

  // Handle Swiss numbers
  // Format: 0783226939 or +41783226939 or 00417832226939
  if (cleaned.startsWith('0041')) {
    // Replace 0041 with +41
    cleaned = '+41' + cleaned.substring(4);
  } else if (cleaned.startsWith('0') && cleaned.length >= 10) {
    // Local Swiss format: 0783226939 -> +41783226939
    // Remove leading 0 and add +41
    cleaned = '+41' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+')) {
    // If it doesn't start with +, assume it's a local number
    // Try to detect if it's Swiss (starts with 0 and 10 digits)
    if (cleaned.match(/^0\d{9}$/)) {
      cleaned = '+41' + cleaned.substring(1);
    } else {
      // For other countries, add + if missing (user should provide country code)
      // But we'll be lenient and accept it as-is
      return phone.trim(); // Return original if we can't normalize
    }
  }

  // Validate E.164 format: +[1-9][0-9]{1,14}
  if (cleaned.match(/^\+[1-9]\d{1,14}$/)) {
    return cleaned;
  }

  // If normalization failed, return original (be lenient)
  return phone.trim();
}

/**
 * Validate phone number format (lenient validation)
 * Accepts various formats, validates basic structure
 */
export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim() === '') {
    return { valid: true }; // Empty is valid (optional field)
  }

  const trimmed = phone.trim();

  // Remove common separators for validation
  const cleaned = trimmed.replace(/[\s\-\(\)\.]/g, '');

  // Accept E.164 format: +[country][number]
  if (cleaned.match(/^\+[1-9]\d{6,14}$/)) {
    return { valid: true };
  }

  // Accept Swiss local format: 0XX XXX XX XX (10 digits starting with 0)
  if (cleaned.match(/^0\d{9}$/)) {
    return { valid: true };
  }

  // Accept Swiss with country code: 0041XXXXXXXXX or +41XXXXXXXXX
  if (cleaned.match(/^(0041|\+41)\d{9}$/)) {
    return { valid: true };
  }

  // Accept numbers with separators (be lenient)
  // At least 7 digits total (minimum for valid phone numbers)
  const digitCount = cleaned.replace(/\D/g, '').length;
  if (digitCount >= 7 && digitCount <= 15) {
    // Check if it has reasonable structure
    if (cleaned.match(/^[\+]?[\d\s\-\(\)\.]{7,20}$/)) {
      return { valid: true };
    }
  }

  return {
    valid: false,
    error: 'Please enter a valid phone number (e.g., 0783226939 or +41 78 322 69 39)',
  };
}

/**
 * Format phone number for display (Swiss format)
 */
export function formatPhoneNumberForDisplay(phone: string): string {
  const normalized = normalizePhoneNumber(phone);

  if (!normalized) {
    return phone;
  }

  // Format Swiss numbers: +41783226939 -> +41 78 322 69 39
  if (normalized.startsWith('+41') && normalized.length === 12) {
    const number = normalized.substring(3);
    return `+41 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5, 7)} ${number.substring(7)}`;
  }

  // For other formats, return normalized
  return normalized;
}
