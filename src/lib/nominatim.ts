/**
 * Nominatim (OpenStreetMap) API Utilities
 *
 * Free location search API - no API key required!
 * Rate limit: 1 request per second (we debounce to respect this)
 */

import { logger } from '@/utils/logger';

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    state?: string;
    region?: string;
    country?: string;
    country_code?: string;
    postcode?: string;
    'ISO3166-2'?: string;
    state_code?: string;
  };
}

export interface LocationSuggestion {
  id: string;
  mainText: string;
  secondaryText: string;
  displayName: string;
  placeId: number;
  lat?: number;
  lon?: number;
}

/**
 * Search for locations using Nominatim
 * Free, no API key required!
 *
 * @param query - Search query (city name, address, etc.)
 * @param limit - Maximum number of results (default: 5)
 * @returns Array of location suggestions
 */
export async function searchNominatim(
  query: string,
  limit: number = 5
): Promise<LocationSuggestion[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Nominatim search API - free, no key needed
    // Rate limit: 1 request/second (we debounce in component)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'OrangeCat/1.0', // Required by Nominatim
          'Accept-Language': 'en',
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data: NominatimResult[] = await response.json();

    return data.map(result => {
      const address = result.address || {};
      const city =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.suburb ||
        '';
      const country = address.country || '';
      const state = address.state || address.region || '';

      // Format main text (city name)
      const mainText = city || query.split(',')[0];

      // Format secondary text (state, country)
      const parts: string[] = [];
      if (state) {
        parts.push(state);
      }
      if (country) {
        parts.push(country);
      }
      const secondaryText = parts.join(', ');

      return {
        id: `nominatim-${result.place_id}`,
        mainText,
        secondaryText,
        displayName: result.display_name,
        placeId: result.place_id,
        lat: result.lat ? parseFloat(result.lat) : undefined,
        lon: result.lon ? parseFloat(result.lon) : undefined,
      };
    });
  } catch (error) {
    logger.error('Nominatim search error', error, 'LOCATION');
    return [];
  }
}

/**
 * Get detailed location data from Nominatim place ID
 */
export async function getNominatimDetails(placeId: number): Promise<{
  country: string;
  city: string;
  zipCode: string;
  state?: string;
  stateCode?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress: string;
} | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/lookup?osm_ids=R${placeId}&format=json&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'OrangeCat/1.0',
          'Accept-Language': 'en',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data: NominatimResult[] = await response.json();
    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    const address = result.address || {};

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.suburb ||
      '';
    const countryCode = address.country_code?.toUpperCase() || '';
    const countryName = address.country || '';
    const zipCode = address.postcode || '';
    const state = address.state || address.region || '';
    const stateCode = address['ISO3166-2']?.split('-')[1] || address.state_code || '';

    // Build a clean formatted address (avoid redundant parts like "Zurich, District Zurich, Zurich")
    const parts: string[] = [];
    if (city) {
      parts.push(city);
    }
    // For Swiss locations, show canton; for others show state
    if (countryCode === 'CH' && stateCode) {
      parts.push(stateCode); // e.g. "ZH" for Zurich canton
    } else if (state && state !== city) {
      parts.push(state);
    }
    if (countryName) {
      parts.push(countryName);
    }
    const formattedAddress = parts.join(', ');

    return {
      country: countryCode,
      city,
      zipCode,
      state: state || undefined,
      stateCode: stateCode || undefined,
      latitude: result.lat ? parseFloat(result.lat) : undefined,
      longitude: result.lon ? parseFloat(result.lon) : undefined,
      formattedAddress,
    };
  } catch (error) {
    logger.error('Nominatim details error', error, 'LOCATION');
    return null;
  }
}
