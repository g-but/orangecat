/**
 * Profile Location Section
 *
 * Form section for location input and visibility controls.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

'use client';

import { LocationInput } from '@/components/ui/LocationInput';
import { Input } from '@/components/ui/Input';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ProfileFieldType } from '@/lib/profile-guidance';
import { LocationMode } from '@/lib/location-privacy';
import { ProfileLocationSectionProps } from '../types';

export function ProfileLocationSection({
  form,
  onFieldFocus,
  locationMode,
  setLocationMode,
  locationGroupLabel,
  setLocationGroupLabel,
}: ProfileLocationSectionProps) {
  return (
    <>
      {/* Location - Smart autocomplete */}
      <FormField
        control={form.control}
        name="location_search"
        render={({ field }) => (
          <FormItem id="location">
            <FormLabel className="text-sm font-medium text-gray-700">Location</FormLabel>
            <FormControl>
              <LocationInput
                value={field.value || ''}
                onFocus={() => onFieldFocus?.('location')}
                onChange={locationData => {
                  if (locationData) {
                    // Update the structured location fields
                    form.setValue('location_country', locationData.country);
                    form.setValue('location_city', locationData.city);
                    form.setValue('location_zip', locationData.zipCode);
                    form.setValue('location_search', locationData.formattedAddress);

                    // Store canton/state information in location_context
                    if (locationData.country === 'CH' && locationData.canton) {
                      // Swiss canton
                      const cantonInfo = locationData.cantonCode
                        ? `${locationData.canton} (${locationData.cantonCode})`
                        : locationData.canton;
                      form.setValue('location_context', cantonInfo);
                    } else if (locationData.state) {
                      // Other countries - store state/province
                      const stateInfo = locationData.stateCode
                        ? `${locationData.state} (${locationData.stateCode})`
                        : locationData.state;
                      form.setValue('location_context', stateInfo);
                    }

                    // Store coordinates if available (for future use)
                    if (locationData.latitude && locationData.longitude) {
                      form.setValue('latitude', locationData.latitude);
                      form.setValue('longitude', locationData.longitude);
                    }
                    // If user was in group mode, switch back to actual when they pick a real place
                    if (locationMode !== 'actual') {
                      setLocationMode('actual');
                    }
                  } else {
                    // Clear location data
                    form.setValue('location_country', '');
                    form.setValue('location_city', '');
                    form.setValue('location_zip', '');
                    form.setValue('location_search', '');
                    form.setValue('latitude', undefined);
                    form.setValue('longitude', undefined);
                  }
                }}
                placeholder="Type your city or address..."
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500">
              Choose how this appears below: show real city, hide it, or use a custom group like
              &quot;Moon&quot; or &quot;Hell&quot;.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Location visibility/group controls */}
      <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="text-xs font-medium text-gray-700 mb-2">Location visibility</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="location_mode"
              className="accent-orange-600"
              checked={locationMode === 'actual'}
              onChange={() => setLocationMode('actual')}
            />
            Show actual city/region
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="location_mode"
              className="accent-orange-600"
              checked={locationMode === 'hidden'}
              onChange={() => setLocationMode('hidden')}
            />
            Hide my location
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="location_mode"
              className="accent-orange-600"
              checked={locationMode === 'group'}
              onChange={() => setLocationMode('group')}
            />
            Use custom group
          </label>
        </div>
        {locationMode === 'group' && (
          <div className="mt-2 flex items-center gap-2">
            <Input
              placeholder="e.g., Hell, Moon, 69420"
              value={locationGroupLabel}
              onChange={e => setLocationGroupLabel(e.target.value)}
              className="max-w-sm"
            />
            <span className="text-xs text-gray-500">
              People with the same label see each other.
            </span>
          </div>
        )}
      </div>

      {/* Hidden fields for structured location data */}
      <input type="hidden" {...form.register('location_country')} />
      <input type="hidden" {...form.register('location_city')} />
      <input type="hidden" {...form.register('location_zip')} />
      <input type="hidden" {...form.register('latitude')} />
      <input type="hidden" {...form.register('longitude')} />
      <input type="hidden" {...form.register('location_context')} />
    </>
  );
}


