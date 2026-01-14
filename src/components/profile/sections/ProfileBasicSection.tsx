/**
 * Profile Basic Section
 *
 * Form section for basic profile information (username, name, bio, location).
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ProfileFieldType } from '@/lib/profile-guidance';
import { LocationMode } from '@/lib/location-privacy';
import { Control } from 'react-hook-form';
import type { ProfileFormValues } from '../types';
import { ProfileLocationSection } from './ProfileLocationSection';
import { PROFILE_SECTIONS, PROFILE_SECTION_DESCRIPTIONS } from '../constants';

interface ProfileBasicSectionProps {
  control: Control<ProfileFormValues>;
  onFieldFocus?: (field: ProfileFieldType) => void;
  locationMode: LocationMode;
  setLocationMode: (mode: LocationMode) => void;
  locationGroupLabel: string;
  setLocationGroupLabel: (value: string) => void;
  form: {
    control: Control<ProfileFormValues>;
    setValue: (name: keyof ProfileFormValues, value: any) => void;
    register: (name: keyof ProfileFormValues) => any;
  };
}

export function ProfileBasicSection({
  control,
  onFieldFocus,
  locationMode,
  setLocationMode,
  locationGroupLabel,
  setLocationGroupLabel,
  form,
}: ProfileBasicSectionProps) {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white/80 px-4 py-5 sm:px-5 sm:py-6">
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          {PROFILE_SECTIONS.PROFILE}
        </h3>
        <p className="mt-1 text-xs text-gray-500">{PROFILE_SECTION_DESCRIPTIONS.PROFILE}</p>
      </div>

      {/* Username - Required field */}
      <FormField
        control={control}
        name="username"
        render={({ field }) => {
          const { value, ...rest } = field;
          return (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">
                Username <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium z-10 pointer-events-none">
                    @
                  </span>
                  <Input
                    placeholder="your_unique_username"
                    className="pl-8"
                    {...rest}
                    value={value || ''}
                    onFocus={() => onFieldFocus?.('username')}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      {/* Name - Display name */}
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem id="name">
            <FormLabel className="text-sm font-medium text-gray-700">Name</FormLabel>
            <FormControl>
              <Input
                placeholder="Your display name"
                {...field}
                value={field.value || ''}
                onFocus={() => onFieldFocus?.('name')}
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500">
              This is how others will see you
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Bio */}
      <FormField
        control={control}
        name="bio"
        render={({ field }) => (
          <FormItem id="bio">
            <FormLabel className="text-sm font-medium text-gray-700">Bio</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Tell your story..."
                className="min-h-[80px] resize-none"
                {...field}
                value={field.value || ''}
                onFocus={() => onFieldFocus?.('bio')}
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500">
              Share your story with the community
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Location Section */}
      <ProfileLocationSection
        form={form}
        onFieldFocus={onFieldFocus}
        locationMode={locationMode}
        setLocationMode={setLocationMode}
        locationGroupLabel={locationGroupLabel}
        setLocationGroupLabel={setLocationGroupLabel}
      />
    </div>
  );
}

