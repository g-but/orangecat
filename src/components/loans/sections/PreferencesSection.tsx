/**
 * Preferences Section
 *
 * Form section for listing preferences.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created preferences section component
 */

'use client';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { Control } from 'react-hook-form';
import type { LoanFormData } from '../validation';
import { CONTACT_METHODS } from '../constants';

interface PreferencesSectionProps {
  control: Control<LoanFormData>;
}

export function PreferencesSection({ control }: PreferencesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Listing Preferences</CardTitle>
        <CardDescription>Control how your loan appears to potential offerers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <FormLabel>Public Listing</FormLabel>
            <FormDescription>Allow anyone to see and offer on your loan</FormDescription>
          </div>
          <FormField
            control={control}
            name="is_public"
            render={({ field }) => (
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            )}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <FormLabel>Negotiable Terms</FormLabel>
            <FormDescription>Allow offerers to propose different terms</FormDescription>
          </div>
          <FormField
            control={control}
            name="is_negotiable"
            render={({ field }) => (
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            )}
          />
        </div>

        <FormField
          control={control}
          name="minimum_offer_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Offer Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Only accept offers above this amount"
                  {...field}
                  onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                />
              </FormControl>
              <FormDescription>
                Optional: Set a minimum amount for serious offers only
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="preferred_terms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Terms</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Prefer lower interest rate over longer term"
                  className="min-h-[60px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Let offerers know what terms you prefer</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="contact_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CONTACT_METHODS.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>How you prefer to be contacted about offers</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}


