/**
 * Currency Input Parsing & Validation
 */

// ==================== INPUT PARSING ====================

export function parseAmount(input: string, _locale: string = 'en-US'): number | null {
  if (!input || input.trim() === '') {
    return null;
  }

  // Remove currency symbols and whitespace
  let cleaned = input.replace(/[^0-9.,\-]/g, '').trim();

  // Handle European format (1.234,56) vs US format (1,234.56)
  const hasCommaDecimal =
    cleaned.includes(',') &&
    (cleaned.indexOf(',') > cleaned.lastIndexOf('.') || !cleaned.includes('.'));

  if (hasCommaDecimal) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

// ==================== AMOUNT VALIDATION ====================

export function validateAmount(
  amount: number,
  currency: string
): { valid: boolean; error?: string } {
  if (amount < 0) {
    return { valid: false, error: 'Amount cannot be negative' };
  }

  if (currency === 'SATS') {
    if (!Number.isInteger(amount)) {
      return { valid: false, error: 'Sats must be a whole number' };
    }
    if (amount > 21_000_000 * 100_000_000) {
      return { valid: false, error: 'Amount exceeds maximum Bitcoin supply' };
    }
  }

  if (currency === 'BTC') {
    if (amount > 21_000_000) {
      return { valid: false, error: 'Amount exceeds maximum Bitcoin supply' };
    }
  }

  return { valid: true };
}

// ==================== BTC-SPECIFIC HELPERS ====================

export function parseBTCAmount(input: string | null | undefined): number {
  if (!input || typeof input !== 'string') {
    return 0;
  }

  const cleaned = input
    .trim()
    .replace(/\s*BTC\s*/i, '')
    .trim();
  if (!cleaned) {
    return 0;
  }

  const parsed = parseFloat(cleaned);
  if (!isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

export function validateBTCAmount(amount: unknown): boolean {
  if (typeof amount !== 'number') {
    return false;
  }
  if (!isFinite(amount)) {
    return false;
  }
  if (amount < 0) {
    return false;
  }
  if (amount > 21_000_000) {
    return false;
  }
  return true;
}
