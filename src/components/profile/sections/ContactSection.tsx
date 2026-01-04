/**
 * Contact Section
 *
 * Form section for contact information (email, phone).
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

'use client';

import { Mail } from 'lucide-react';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/Input';
import { ProfileFieldType } from '@/lib/profile-guidance';
import { Control } from 'react-hook-form';
import { ProfileFormValues } from '../types';
import { PROFILE_SECTIONS, PROFILE_SECTION_DESCRIPTIONS } from '../constants';

interface ContactSectionProps {
  control: Control<ProfileFormValues>;
  onFieldFocus?: (field: ProfileFieldType) => void;
  userEmail?: string;
}

export function ContactSection({ control, onFieldFocus, userEmail }: ContactSectionProps) {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white/80 px-4 py-5 sm:px-5 sm:py-6">
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          {PROFILE_SECTIONS.CONTACT}
        </h3>
        <p className="mt-1 text-xs text-gray-500">{PROFILE_SECTION_DESCRIPTIONS.CONTACT}</p>
      </div>

      {/* Contact Email */}
      <FormField
        control={control}
        name="contact_email"
        render={({ field }) => (
          <FormItem id="contactEmail">
            <FormLabel className="text-sm font-medium text-gray-700">Contact Email (public)</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="contact@example.com"
                {...field}
                value={field.value || ''}
                onFocus={() => onFieldFocus?.('contactEmail')}
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500">
              Visible on your public profile. Defaults to your registration email.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Registration Email (read-only) */}
      {userEmail && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Registration Email (private)</span>
          </div>
          <p className="text-sm text-gray-900">{userEmail}</p>
          <p className="text-xs text-gray-500 mt-1">Used for account login only</p>
        </div>
      )}

      {/* Phone */}
      <FormField
        control={control}
        name="phone"
        render={({ field }) => (
          <FormItem id="phone">
            <FormLabel className="text-sm font-medium text-gray-700">Phone (optional)</FormLabel>
            <FormControl>
              <Input
                type="tel"
                placeholder="+41 XX XXX XX XX"
                {...field}
                value={field.value || ''}
                onFocus={() => onFieldFocus?.('phone')}
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500">
              Helps supporters contact you
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}


