/**
 * Online Presence Section
 *
 * Form section for website and social media links.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

'use client';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/Input';
import { OnlinePresenceSectionProps } from '../types';
import { SocialLinksEditor } from '../SocialLinksEditor';
import { MAX_SOCIAL_LINKS, PROFILE_SECTIONS, PROFILE_SECTION_DESCRIPTIONS } from '../constants';

export function OnlinePresenceSection({
  control,
  onFieldFocus,
  socialLinks,
  setSocialLinks,
}: OnlinePresenceSectionProps) {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white/80 px-4 py-5 sm:px-5 sm:py-6">
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          {PROFILE_SECTIONS.ONLINE_PRESENCE}
        </h3>
        <p className="mt-1 text-xs text-gray-500">{PROFILE_SECTION_DESCRIPTIONS.ONLINE_PRESENCE}</p>
      </div>

      {/* Website */}
      <FormField
        control={control}
        name="website"
        render={({ field }) => (
          <FormItem id="website">
            <FormLabel className="text-sm font-medium text-gray-700">Website</FormLabel>
            <FormControl>
              <Input
                placeholder="https://your-website.com"
                {...field}
                value={field.value || ''}
                onFocus={() => onFieldFocus?.('website')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Social Media & Links */}
      <div id="socialLinks" className="pt-4 mt-2 border-t border-gray-100">
        <div onFocus={() => onFieldFocus?.('socialLinks')} tabIndex={-1}>
          <SocialLinksEditor
            links={socialLinks}
            onChange={setSocialLinks}
            maxLinks={MAX_SOCIAL_LINKS}
          />
        </div>
        <p className="text-xs text-gray-500 mt-3">
          💡 Want to add wallets? Manage them in{' '}
          <a
            href="/dashboard/wallets"
            className="text-orange-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            My Wallets
          </a>
        </p>
      </div>
    </div>
  );
}
