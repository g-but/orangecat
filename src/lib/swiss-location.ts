/**
 * Swiss Location Utilities
 *
 * Provides Swiss-specific location lookup and canton mapping.
 * Swiss zip codes are 4 digits and unique - perfect for quick location entry.
 */

// Swiss cantons mapping (ISO 3166-2:CH codes)
export const SWISS_CANTONS: Record<string, { code: string; name: string; nameEn: string }> = {
  AG: { code: 'AG', name: 'Aargau', nameEn: 'Aargau' },
  AI: { code: 'AI', name: 'Appenzell Innerrhoden', nameEn: 'Appenzell Innerrhoden' },
  AR: { code: 'AR', name: 'Appenzell Ausserrhoden', nameEn: 'Appenzell Ausserrhoden' },
  BE: { code: 'BE', name: 'Bern', nameEn: 'Bern' },
  BL: { code: 'BL', name: 'Basel-Landschaft', nameEn: 'Basel-Landschaft' },
  BS: { code: 'BS', name: 'Basel-Stadt', nameEn: 'Basel-Stadt' },
  FR: { code: 'FR', name: 'Freiburg', nameEn: 'Fribourg' },
  GE: { code: 'GE', name: 'Genf', nameEn: 'Geneva' },
  GL: { code: 'GL', name: 'Glarus', nameEn: 'Glarus' },
  GR: { code: 'GR', name: 'Graubünden', nameEn: 'Grisons' },
  JU: { code: 'JU', name: 'Jura', nameEn: 'Jura' },
  LU: { code: 'LU', name: 'Luzern', nameEn: 'Lucerne' },
  NE: { code: 'NE', name: 'Neuenburg', nameEn: 'Neuchâtel' },
  NW: { code: 'NW', name: 'Nidwalden', nameEn: 'Nidwalden' },
  OW: { code: 'OW', name: 'Obwalden', nameEn: 'Obwalden' },
  SG: { code: 'SG', name: 'St. Gallen', nameEn: 'St. Gallen' },
  SH: { code: 'SH', name: 'Schaffhausen', nameEn: 'Schaffhausen' },
  SO: { code: 'SO', name: 'Solothurn', nameEn: 'Solothurn' },
  SZ: { code: 'SZ', name: 'Schwyz', nameEn: 'Schwyz' },
  TG: { code: 'TG', name: 'Thurgau', nameEn: 'Thurgau' },
  TI: { code: 'TI', name: 'Tessin', nameEn: 'Ticino' },
  UR: { code: 'UR', name: 'Uri', nameEn: 'Uri' },
  VD: { code: 'VD', name: 'Waadt', nameEn: 'Vaud' },
  VS: { code: 'VS', name: 'Wallis', nameEn: 'Valais' },
  ZG: { code: 'ZG', name: 'Zug', nameEn: 'Zug' },
  ZH: { code: 'ZH', name: 'Zürich', nameEn: 'Zurich' },
};

/**
 * Lookup Swiss location by zip code
 * Uses a free API service for Swiss postal codes
 *
 * @param zipCode - 4-digit Swiss postal code
 * @returns Location data with city, canton, and country
 */
export async function lookupSwissZipCode(zipCode: string): Promise<{
  city: string;
  canton: string;
  cantonCode: string;
  country: string;
} | null> {
  // Clean zip code (remove spaces, ensure 4 digits)
  const cleanZip = zipCode.replace(/\s/g, '').trim();

  if (!/^\d{4}$/.test(cleanZip)) {
    return null;
  }

  try {
    // Use Nominatim (OpenStreetMap) API - free and reliable
    // Swiss postal codes are well-mapped in OSM
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${cleanZip}&country=ch&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'OrangeCat/1.0', // Required by Nominatim
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

    // Extract canton from address
    // Nominatim uses 'state' or 'ISO3166-2' for canton
    let cantonCode = address['ISO3166-2'] || address.state_code || '';
    if (cantonCode && cantonCode.startsWith('CH-')) {
      cantonCode = cantonCode.replace('CH-', '');
    }

    const canton = address.state || SWISS_CANTONS[cantonCode]?.nameEn || cantonCode;
    const city = address.city || address.town || address.village || address.municipality || '';

    if (!city || !cantonCode) {
      return null;
    }

    return {
      city,
      canton,
      cantonCode,
      country: 'CH',
    };
  } catch (error) {
    console.error('Swiss zip code lookup error:', error);
    return null;
  }
}

/**
 * Check if a string looks like a Swiss zip code (4 digits)
 */
export function isSwissZipCode(input: string): boolean {
  const clean = input.replace(/\s/g, '').trim();
  return /^\d{4}$/.test(clean);
}

/**
 * Extract canton code from Google Places address components
 */
export function extractCantonFromGooglePlaces(
  addressComponents: google.maps.places.PlaceResult['address_components']
): { canton: string; cantonCode: string } | null {
  if (!addressComponents) {
    return null;
  }

  for (const component of addressComponents) {
    const types = component.types;

    // Google Places uses 'administrative_area_level_1' for canton/state
    if (types.includes('administrative_area_level_1')) {
      const shortName = component.short_name || '';
      const longName = component.long_name || '';

      // Check if it's a Swiss canton code (2 letters)
      if (/^[A-Z]{2}$/.test(shortName) && SWISS_CANTONS[shortName]) {
        return {
          canton: SWISS_CANTONS[shortName].nameEn,
          cantonCode: shortName,
        };
      }

      // Try to match by name
      for (const [code, info] of Object.entries(SWISS_CANTONS)) {
        if (longName.includes(info.name) || longName.includes(info.nameEn)) {
          return {
            canton: info.nameEn,
            cantonCode: code,
          };
        }
      }
    }
  }

  return null;
}



