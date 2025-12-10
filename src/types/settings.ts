/**
 * USER SETTINGS & PREFERENCES TYPES
 *
 * Type definitions for user settings including currency, privacy, and notifications.
 *
 * Created: 2025-12-04
 * Last Modified: 2025-12-04
 * Last Modified Summary: Initial settings types
 */

// ==================== CURRENCY TYPES ====================

export type FiatCurrency = 'CHF' | 'EUR' | 'USD' | 'GBP';
export type CryptoCurrency = 'BTC' | 'SATS';
export type Currency = FiatCurrency | CryptoCurrency;

export const FIAT_CURRENCIES: FiatCurrency[] = ['CHF', 'EUR', 'USD', 'GBP'];
export const CRYPTO_CURRENCIES: CryptoCurrency[] = ['BTC', 'SATS'];
export const ALL_CURRENCIES: Currency[] = [...FIAT_CURRENCIES, ...CRYPTO_CURRENCIES];

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  decimals: number;
  type: 'fiat' | 'crypto';
}

export const CURRENCY_INFO: Record<Currency, CurrencyInfo> = {
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2, type: 'fiat' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, type: 'fiat' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, type: 'fiat' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2, type: 'fiat' },
  BTC: { code: 'BTC', symbol: '₿', name: 'Bitcoin', decimals: 8, type: 'crypto' },
  SATS: { code: 'SATS', symbol: '⚡', name: 'Satoshis', decimals: 0, type: 'crypto' },
};

// Country to default currency mapping
export const COUNTRY_CURRENCY_MAP: Record<string, FiatCurrency> = {
  CH: 'CHF',
  LI: 'CHF', // Liechtenstein uses CHF
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  AT: 'EUR',
  BE: 'EUR',
  PT: 'EUR',
  IE: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  GB: 'GBP',
  US: 'USD',
};

export interface CurrencyRate {
  id: string;
  baseCurrency: Currency;
  targetCurrency: Currency;
  rate: number;
  source: 'api' | 'manual' | 'initial' | 'fixed';
  fetchedAt: string;
  expiresAt: string;
}

// ==================== PRIVACY SETTINGS ====================

export interface PrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  showPhysicalAddress: boolean;
  showLocation: boolean; // City-level
  showExactLocation: boolean; // Precise coordinates
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  showEmail: false,
  showPhone: false,
  showPhysicalAddress: false,
  showLocation: true,
  showExactLocation: false,
};

// ==================== NOTIFICATION SETTINGS ====================

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  marketingEmails: false,
};

// ==================== DISPLAY SETTINGS ====================

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'de' | 'fr' | 'it';

export interface DisplaySettings {
  theme: Theme;
  language: Language;
  timezone: string | null;
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  theme: 'system',
  language: 'en',
  timezone: null,
};

// ==================== USER SETTINGS ====================

export interface UserSettings {
  id: string;
  userId: string;
  
  // Currency
  defaultCurrency: Currency;
  displayCurrency: Currency;
  countryCode: string | null;
  
  // Privacy
  showEmail: boolean;
  showPhone: boolean;
  showPhysicalAddress: boolean;
  showLocation: boolean;
  showExactLocation: boolean;
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  
  // Display
  theme: Theme;
  language: Language;
  timezone: string | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface UserSettingsUpdate {
  defaultCurrency?: Currency;
  displayCurrency?: Currency;
  countryCode?: string | null;
  showEmail?: boolean;
  showPhone?: boolean;
  showPhysicalAddress?: boolean;
  showLocation?: boolean;
  showExactLocation?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  marketingEmails?: boolean;
  theme?: Theme;
  language?: Language;
  timezone?: string | null;
}

// ==================== PHYSICAL ADDRESS ====================

export interface PhysicalAddress {
  streetAddress: string | null;
  streetAddress2: string | null;
  city: string | null;
  stateProvince: string | null;
  postalCode: string | null;
  country: string | null;
}

export const EMPTY_PHYSICAL_ADDRESS: PhysicalAddress = {
  streetAddress: null,
  streetAddress2: null,
  city: null,
  stateProvince: null,
  postalCode: null,
  country: null,
};



















