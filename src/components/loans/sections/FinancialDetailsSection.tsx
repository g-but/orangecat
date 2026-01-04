/**
 * Financial Details Section
 *
 * Form section for loan financial information.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created financial details section component
 */

'use client';

import {
  FormControl,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { DollarSign, Percent } from 'lucide-react';
import type { Control } from 'react-hook-form';
import type { LoanFormData } from '../validation';
import { currencySelectOptions } from '@/config/currencies';

interface FinancialDetailsSectionProps {
  control: Control<LoanFormData>;
}

export function FinancialDetailsSection({ control }: FinancialDetailsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Financial Details
        </CardTitle>
        <CardDescription>Current loan information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="original_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original Amount *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="5000.00"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="remaining_balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remaining Balance *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="3500.00"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="interest_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Interest Rate (%)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="24.99"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="monthly_payment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Payment</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="125.00"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {currencySelectOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}


