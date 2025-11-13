'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Input } from './Input';
import { MapPin } from 'lucide-react';

interface LocationData {
  country: string;
  city: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  formattedAddress: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (locationData: LocationData | null) => void;
  placeholder?: string;
  className?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search for your location...',
  className,
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autocompleteService, setAutocompleteService] =
    useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize Google Maps API
  useEffect(() => {
    const initGoogleMaps = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
          console.warn(
            'Google Maps API key not found. Location autocomplete will not work. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.'
          );
          return;
        }

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places'],
        });

        const google = await loader.load();

        setAutocompleteService(new google.maps.places.AutocompleteService());
        setPlacesService(new google.maps.places.PlacesService(document.createElement('div')));
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
      }
    };

    initGoogleMaps();
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Handle input changes and fetch suggestions
  const handleInputChange = async (newValue: string) => {
    setInputValue(newValue);
    setIsLoading(true);

    if (!autocompleteService || newValue.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    try {
      const request = {
        input: newValue,
        componentRestrictions: { country: [] }, // Allow all countries
        fields: ['place_id', 'description', 'structured_formatting'],
      };

      const response = await autocompleteService.getPlacePredictions(request);
      setSuggestions(response.predictions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService) {
      return;
    }

    setInputValue(prediction.description);
    setShowSuggestions(false);

    try {
      const request = {
        placeId: prediction.place_id,
        fields: ['address_components', 'geometry', 'formatted_address'],
      };

      const result = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
        placesService.getDetails(request, (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {
            reject(new Error(`Places API error: ${status}`));
          }
        });
      });

      // Parse address components
      const addressComponents = result.address_components || [];
      let country = '';
      let city = '';
      let zipCode = '';

      for (const component of addressComponents) {
        const types = component.types;

        if (types.includes('country')) {
          country = component.short_name; // Use short_name for country codes (ISO)
        }
        if (types.includes('locality') || types.includes('administrative_area_level_1')) {
          city = component.long_name;
        }
        if (types.includes('postal_code')) {
          zipCode = component.long_name;
        }
      }

      const locationData: LocationData = {
        country,
        city,
        zipCode,
        latitude: result.geometry?.location?.lat(),
        longitude: result.geometry?.location?.lng(),
        formattedAddress: result.formatted_address || prediction.description,
      };

      onChange(locationData);
    } catch (error) {
      console.error('Place details error:', error);
      // Fallback: just use the description
      onChange({
        country: '',
        city: '',
        zipCode: '',
        formattedAddress: prediction.description,
      });
    }
  };

  // Handle clicks outside suggestions
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

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className={className}
          onFocus={() => inputValue.length >= 3 && setShowSuggestions(true)}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          )}
          <MapPin className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map(prediction => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSuggestionSelect(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {prediction.structured_formatting?.main_text ||
                      prediction.description.split(',')[0]}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {prediction.structured_formatting?.secondary_text || prediction.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && inputValue.length >= 3 && suggestions.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-sm text-gray-500 text-center">
            No locations found. Try a different search term.
          </div>
        </div>
      )}
    </div>
  );
}
