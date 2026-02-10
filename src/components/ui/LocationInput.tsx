'use client';
import { logger } from '@/utils/logger';

import { useState, useEffect, useRef } from 'react';
import { Input } from './Input';
import { MapPin } from 'lucide-react';
import { lookupSwissZipCode, isSwissZipCode } from '@/lib/swiss-location';
import {
  lookupZipCode,
  detectCountryFromZipCode,
  looksLikeZipCode,
  getCountryName,
  ZIP_CODE_PATTERNS,
} from '@/lib/global-location';
import { searchNominatim, getNominatimDetails, LocationSuggestion } from '@/lib/nominatim';
import { SWISS_CANTONS } from '@/lib/swiss-location';

interface LocationData {
  country: string;
  city: string;
  zipCode: string;
  state?: string;
  stateCode?: string;
  canton?: string; // Swiss canton (e.g., "Zurich", "Bern")
  cantonCode?: string; // Swiss canton code (e.g., "ZH", "BE")
  latitude?: number;
  longitude?: number;
  formattedAddress: string;
}

interface LocationInputProps {
  value: string;
  onChange: (locationData: LocationData | null) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
}

// Using Nominatim (OpenStreetMap) - FREE, no API key needed!
// Rate limit: 1 request/second (we debounce to respect this)

export function LocationInput({
  value,
  onChange,
  placeholder = 'Type your city or address...',
  className,
  onFocus,
}: LocationInputProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [_detectedCountry, setDetectedCountry] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const zipCodeLookupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchTimeRef = useRef<number>(0);
  const currentInputValueRef = useRef<string>(value || ''); // Track current input for async callbacks

  // Update input value when prop changes
  useEffect(() => {
    const newVal = value || '';
    setInputValue(newVal);
    currentInputValueRef.current = newVal;
  }, [value]);

  // Handle zip code entry - optimized for minimal friction
  const handleZipCodeLookup = async (
    zipCode: string,
    country: string
  ): Promise<LocationData | null> => {
    try {
      // Try Swiss-specific lookup first (more detailed)
      if (country === 'CH' && isSwissZipCode(zipCode)) {
        const swissLocation = await lookupSwissZipCode(zipCode);
        if (swissLocation) {
          return {
            country: swissLocation.country,
            city: swissLocation.city,
            zipCode: zipCode,
            canton: swissLocation.canton,
            cantonCode: swissLocation.cantonCode,
            formattedAddress: `${swissLocation.city}, ${swissLocation.canton}, Switzerland`,
          };
        }
      }

      // Try global zip code lookup
      const location = await lookupZipCode(zipCode, country);
      if (location) {
        const formatted = location.state
          ? `${location.city}, ${location.state}, ${getCountryName(location.country)}`
          : `${location.city}, ${getCountryName(location.country)}`;

        return {
          country: location.country,
          city: location.city,
          zipCode: location.zipCode,
          state: location.state,
          stateCode: location.stateCode,
          formattedAddress: formatted,
        };
      }
    } catch (error) {
      logger.error('Zip code lookup error:', error);
    }

    return null;
  };

  // Handle input changes - Nominatim search with rate limiting
  const handleInputChange = async (newValue: string) => {
    setInputValue(newValue);
    currentInputValueRef.current = newValue; // Update ref immediately

    // Clear any pending searches
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (zipCodeLookupTimeoutRef.current) {
      clearTimeout(zipCodeLookupTimeoutRef.current);
    }

    // If input is too short, clear suggestions
    if (newValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    // ENHANCEMENT: Try zip code lookup first (fast, works for known countries)
    const looksLikeZip = looksLikeZipCode(newValue);
    if (looksLikeZip && newValue.length >= 4) {
      const cleanZip = newValue.replace(/\s/g, '').trim();
      const detectedCountryFromZip = detectCountryFromZipCode(cleanZip);

      if (detectedCountryFromZip) {
        const pattern = ZIP_CODE_PATTERNS[detectedCountryFromZip];
        if (pattern && cleanZip.length === pattern.length) {
          setIsLoading(true);
          const zipLookupValue = newValue; // Capture current value
          zipCodeLookupTimeoutRef.current = setTimeout(async () => {
            const result = await handleZipCodeLookup(cleanZip, detectedCountryFromZip);
            // Only update if user hasn't continued typing
            if (result && currentInputValueRef.current === zipLookupValue) {
              // Successfully found via zip code
              setInputValue(result.formattedAddress);
              currentInputValueRef.current = result.formattedAddress;
              onChange(result);
              setShowSuggestions(false);
              setIsLoading(false);
              return;
            }
            setIsLoading(false);
          }, 300); // Quick zip lookup
        }
      }
    }

    // PRIMARY: Nominatim search (works globally for city names, addresses)
    // Rate limit: 1 request/second - we debounce and throttle
    setIsLoading(true);

    const searchValue = newValue; // Capture current value
    searchTimeoutRef.current = setTimeout(async () => {
      // Ensure at least 1 second between requests (Nominatim rate limit)
      const now = Date.now();
      const timeSinceLastSearch = now - lastSearchTimeRef.current;
      if (timeSinceLastSearch < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastSearch));
      }
      lastSearchTimeRef.current = Date.now();

      try {
        const results = await searchNominatim(searchValue, 5);
        // Only update if user hasn't continued typing
        if (currentInputValueRef.current === searchValue) {
          setSuggestions(results);
          setShowSuggestions(true);
        }
      } catch (error) {
        logger.error('Nominatim search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); // Debounce 500ms
  };

  // Handle suggestion selection from Nominatim
  const handleSuggestionSelect = async (suggestion: LocationSuggestion) => {
    setInputValue(suggestion.displayName);
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      // Get detailed location data
      const details = await getNominatimDetails(suggestion.placeId);

      if (details) {
        // Extract canton for Swiss locations
        let canton: string | undefined;
        let cantonCode: string | undefined;
        if (details.country === 'CH') {
          // Try to extract canton from state or formatted address
          const stateMatch = details.formattedAddress.match(
            /\b(ZH|BE|LU|UR|SZ|OW|NW|GL|ZG|FR|SO|BS|BL|SH|AR|AI|SG|GR|AG|TG|TI|VD|VS|NE|GE|JU)\b/
          );
          if (stateMatch) {
            cantonCode = stateMatch[1];
            canton = SWISS_CANTONS[cantonCode]?.nameEn || cantonCode;
          } else if (details.state) {
            // Try to match canton name
            for (const [code, cantonData] of Object.entries(SWISS_CANTONS)) {
              if (
                cantonData.nameEn.toLowerCase() === details.state.toLowerCase() ||
                cantonData.name.toLowerCase() === details.state.toLowerCase()
              ) {
                cantonCode = code;
                canton = cantonData.nameEn;
                break;
              }
            }
          }
        }

        const locationData: LocationData = {
          country: details.country,
          city: details.city,
          zipCode: details.zipCode,
          state: details.state,
          stateCode: details.stateCode,
          canton,
          cantonCode,
          latitude: details.latitude || suggestion.lat,
          longitude: details.longitude || suggestion.lon,
          formattedAddress: details.formattedAddress,
        };

        onChange(locationData);
        setDetectedCountry(details.country);
      } else {
        // Fallback: use suggestion data directly
        onChange({
          country: '',
          city: suggestion.mainText,
          zipCode: '',
          formattedAddress: suggestion.displayName,
          latitude: suggestion.lat,
          longitude: suggestion.lon,
        });
      }
    } catch (error) {
      logger.error('Location details error:', error);
      onChange({
        country: '',
        city: suggestion.mainText,
        zipCode: '',
        formattedAddress: suggestion.displayName,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (zipCodeLookupTimeoutRef.current) {
        clearTimeout(zipCodeLookupTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      {/* Single Field - Nominatim Autocomplete (FREE, no API key!) */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className={className}
          onFocus={() => {
            onFocus?.();
            if (inputValue.length >= 2 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          )}
          <MapPin className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map(suggestion => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
              className="w-full px-4 py-3 min-h-[44px] text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{suggestion.mainText}</div>
                  {suggestion.secondaryText && (
                    <div className="text-sm text-gray-600 truncate">{suggestion.secondaryText}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && inputValue.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-sm text-gray-600 text-center">
            No locations found. Try typing a city name or address.
          </div>
        </div>
      )}
    </div>
  );
}
