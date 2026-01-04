/**
 * Lender Info Section
 *
 * Form section for lender information.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created lender info section component
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
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Building } from 'lucide-react';
import type { Control } from 'react-hook-form';
import type { LoanFormData } from '../validation';

interface LenderInfoSectionProps {
  control: Control<LoanFormData>;
}

export function LenderInfoSection({ control }: LenderInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building className="h-4 w-4" />
          Lender Information
        </CardTitle>
        <CardDescription>Details about your current lender (optional)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="lender_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lender Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Chase, Wells Fargo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="loan_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loan/Account Number</FormLabel>
              <FormControl>
                <Input placeholder="Last 4 digits only" {...field} />
              </FormControl>
              <FormDescription>
                Only share last 4 digits for privacy and verification
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}


