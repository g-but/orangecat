/**
 * Basic Info Section
 *
 * Form section for basic loan information.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created basic info section component
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { Control } from 'react-hook-form';
import type { LoanFormData } from '../validation';
import type { LoanCategory } from '@/types/loans';

interface BasicInfoSectionProps {
  control: Control<LoanFormData>;
  categories: LoanCategory[];
  categoriesLoading: boolean;
  categoriesError: string | null;
}

export function BasicInfoSection({
  control,
  categories,
  categoriesLoading,
  categoriesError,
}: BasicInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Basic Information</CardTitle>
        <CardDescription>Tell us about your loan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loan Title *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., My Credit Card Debt" {...field} />
              </FormControl>
              <FormDescription>A descriptive name for your loan listing</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="loan_category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loan Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={categoriesLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoriesLoading && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Loading categories...
                    </div>
                  )}
                  {!categoriesLoading &&
                    categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {categoriesError && (
                <FormDescription className="text-red-600">{categoriesError}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional details about your loan..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional details to help potential offerers understand your situation
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}


