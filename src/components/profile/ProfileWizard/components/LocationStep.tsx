/**
 * LOCATION STEP COMPONENT
 * Location search and context fields
 */

import { UseFormReturn } from 'react-hook-form';
import { MapPin } from 'lucide-react';
import { Textarea } from '@/components/ui/Textarea';
import { LocationInput } from '@/components/ui/LocationInput';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { ProfileFormValues } from '../types';

interface LocationStepProps {
  form: UseFormReturn<ProfileFormValues>;
}

export function LocationStep({ form }: LocationStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Where are you located?</h2>
        <p className="text-gray-600 mb-3">Help local people find and support your projects.</p>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full">
          <span>🌍</span>
          <span>All location fields are optional</span>
        </div>
      </div>

      <FormField
        control={form.control}
        name="location_search"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </FormLabel>
            <FormControl>
              <LocationInput
                value={field.value || ''}
                onChange={locationData => {
                  if (locationData) {
                    form.setValue('location_country', locationData.country);
                    form.setValue('location_city', locationData.city);
                    form.setValue('location_zip', locationData.zipCode);
                    form.setValue('location_search', locationData.formattedAddress);

                    // Store canton/state information in location_context
                    if (locationData.country === 'CH' && locationData.canton) {
                      const cantonInfo = locationData.cantonCode
                        ? `${locationData.canton} (${locationData.cantonCode})`
                        : locationData.canton;
                      form.setValue('location_context', cantonInfo);
                    } else if (locationData.state) {
                      const stateInfo = locationData.stateCode
                        ? `${locationData.state} (${locationData.stateCode})`
                        : locationData.state;
                      form.setValue('location_context', stateInfo);
                    }

                    if (locationData.latitude && locationData.longitude) {
                      form.setValue('latitude', locationData.latitude);
                      form.setValue('longitude', locationData.longitude);
                    }
                  } else {
                    form.setValue('location_country', '');
                    form.setValue('location_city', '');
                    form.setValue('location_zip', '');
                    form.setValue('location_search', '');
                    form.setValue('location_context', '');
                    form.setValue('latitude', undefined);
                    form.setValue('longitude', undefined);
                  }
                }}
                placeholder="Search for your city or address..."
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500">
              Start typing to find your location. This helps local people and projects find you.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="location_context"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700">Location Context</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value || ''}
                placeholder="Any additional context about your location? (e.g., 'Based in Zurich, working remotely')"
                className="text-sm resize-none"
                rows={2}
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500">
              Optional: Add context to help people understand your location better
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
