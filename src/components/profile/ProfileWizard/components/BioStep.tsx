/**
 * BIO STEP COMPONENT
 * Background and inspiration fields
 */

import { UseFormReturn } from 'react-hook-form';
import { Textarea } from '@/components/ui/Textarea';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { ProfileFormValues } from '../types';

interface BioStepProps {
  form: UseFormReturn<ProfileFormValues>;
}

export function BioStep({ form }: BioStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Share Your Story</h2>
        <p className="text-gray-600 mb-3">Help supporters understand what drives you.</p>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
          <span>💭</span>
          <span>All story fields are optional</span>
        </div>
      </div>

      <FormField
        control={form.control}
        name="background"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700">
              Professional Background
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value || ''}
                placeholder="What's your background? Any relevant experience or education..."
                className="text-sm resize-none"
                rows={4}
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500">
              Optional: Share your experience to build credibility
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="inspiration_statement"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700">What Inspires You?</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value || ''}
                placeholder="What drives you? What's your 'why'?"
                className="text-sm resize-none"
                rows={3}
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500">
              Optional: Help supporters understand your motivation
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
