/**
 * Global Location Utilities
 *
 * Provides location lookup for multiple countries using zip/postal codes.
 * Optimized for minimal user friction - country selection + zip code entry.
 */

// Common zip code patterns by country (for detection)
export const ZIP_CODE_PATTERNS: Record<string, { pattern: RegExp; length: number }> = {
  CH: { pattern: /^\d{4}$/, length: 4 }, // Switzerland
  US: { pattern: /^\d{5}(-\d{4})?$/, length: 5 }, // USA
  CA: { pattern: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/, length: 6 }, // Canada
  GB: { pattern: /^[A-Z]{1,2}\d{1,2}[A-Z]? ?\d[A-Z]{2}$/i, length: 6 }, // UK
  DE: { pattern: /^\d{5}$/, length: 5 }, // Germany
  FR: { pattern: /^\d{5}$/, length: 5 }, // France
  IT: { pattern: /^\d{5}$/, length: 5 }, // Italy
  ES: { pattern: /^\d{5}$/, length: 5 }, // Spain
  NL: { pattern: /^\d{4} ?[A-Z]{2}$/i, length: 6 }, // Netherlands
  BE: { pattern: /^\d{4}$/, length: 4 }, // Belgium
  AT: { pattern: /^\d{4}$/, length: 4 }, // Austria
  SE: { pattern: /^\d{3} ?\d{2}$/, length: 5 }, // Sweden
  NO: { pattern: /^\d{4}$/, length: 4 }, // Norway
  DK: { pattern: /^\d{4}$/, length: 4 }, // Denmark
  FI: { pattern: /^\d{5}$/, length: 5 }, // Finland
  PL: { pattern: /^\d{2}-\d{3}$/, length: 6 }, // Poland
  AU: { pattern: /^\d{4}$/, length: 4 }, // Australia
  NZ: { pattern: /^\d{4}$/, length: 4 }, // New Zealand
  JP: { pattern: /^\d{3}-\d{4}$/, length: 8 }, // Japan
  BR: { pattern: /^\d{5}-?\d{3}$/, length: 8 }, // Brazil
  MX: { pattern: /^\d{5}$/, length: 5 }, // Mexico
  IN: { pattern: /^\d{6}$/, length: 6 }, // India
  CN: { pattern: /^\d{6}$/, length: 6 }, // China
};

/**
 * Detect country from zip code format (heuristic)
 */
export function detectCountryFromZipCode(zipCode: string): string | null {
  const clean = zipCode.replace(/\s/g, '').trim();

  for (const [country, { pattern }] of Object.entries(ZIP_CODE_PATTERNS)) {
    if (pattern.test(clean)) {
      return country;
    }
  }

  // If it's a pure number, try common numeric patterns
  if (/^\d+$/.test(clean)) {
    const len = clean.length;
    if (len === 4) {
      return 'CH';
    } // Could be CH, BE, AT, NO, DK, AU, NZ
    if (len === 5) {
      return 'US';
    } // Could be US, DE, FR, IT, ES, FI
    if (len === 6) {
      return 'IN';
    } // Could be IN, CN
  }

  return null;
}

/**
 * Lookup location by zip code and country using Nominatim (OpenStreetMap)
 * Works globally for most countries
 */
export async function lookupZipCode(
  zipCode: string,
  countryCode: string
): Promise<{
  city: string;
  state?: string;
  stateCode?: string;
  country: string;
  zipCode: string;
} | null> {
  const cleanZip = zipCode.replace(/\s/g, '').trim();

  if (!cleanZip) {
    return null;
  }

  try {
    // Use Nominatim (OpenStreetMap) API - free and reliable
    // Works globally for most countries
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(cleanZip)}&countrycodes=${countryCode.toLowerCase()}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'OrangeCat/1.0', // Required by Nominatim
          'Accept-Language': 'en',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    const address = result.address || {};

    // Extract location data
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.suburb ||
      '';
    const state = address.state || address.region || '';
    const stateCode = address['ISO3166-2']?.split('-')[1] || address.state_code || '';

    // Clean state code
    let cleanStateCode = stateCode;
    if (cleanStateCode && cleanStateCode.includes('-')) {
      cleanStateCode = cleanStateCode.split('-')[1];
    }

    if (!city) {
      return null;
    }

    return {
      city,
      state: state || undefined,
      stateCode: cleanStateCode || undefined,
      country: countryCode.toUpperCase(),
      zipCode: cleanZip,
    };
  } catch (error) {
    console.error('Zip code lookup error:', error);
    return null;
  }
}

/**
 * Check if a string looks like a zip code
 */
export function looksLikeZipCode(input: string): boolean {
  const clean = input.replace(/\s/g, '').trim();

  // Check against known patterns
  for (const { pattern } of Object.values(ZIP_CODE_PATTERNS)) {
    if (pattern.test(clean)) {
      return true;
    }
  }

  // Check if it's a pure number (common zip code format)
  if (/^\d{4,6}$/.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Get country name from code
 */
export function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    CH: 'Switzerland',
    US: 'United States',
    CA: 'Canada',
    GB: 'United Kingdom',
    DE: 'Germany',
    FR: 'France',
    IT: 'Italy',
    ES: 'Spain',
    NL: 'Netherlands',
    BE: 'Belgium',
    AT: 'Austria',
    SE: 'Sweden',
    NO: 'Norway',
    DK: 'Denmark',
    FI: 'Finland',
    PL: 'Poland',
    AU: 'Australia',
    NZ: 'New Zealand',
    JP: 'Japan',
    BR: 'Brazil',
    MX: 'Mexico',
    IN: 'India',
    CN: 'China',
  };

  return countryNames[countryCode.toUpperCase()] || countryCode;
}



