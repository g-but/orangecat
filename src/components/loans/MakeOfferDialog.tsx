'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
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
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Target, DollarSign, Percent, Calendar } from 'lucide-react';
import loansService from '@/services/loans';
import { Loan, CreateLoanOfferRequest } from '@/types/loans';
import { toast } from 'sonner';

const offerSchema = z.object({
  offer_type: z.enum(['refinance', 'payoff']),
  offer_amount: z.number().min(0.01, 'Offer amount must be greater than 0'),
  interest_rate: z.number().min(0).max(100).optional(),
  term_months: z.number().min(1).max(360).optional(),
  terms: z.string().optional(),
  conditions: z.string().optional(),
}).refine((data) => {
  // If refinance offer, require interest rate and term
  if (data.offer_type === 'refinance') {
    return data.interest_rate !== undefined && data.term_months !== undefined;
  }
  return true;
}, {
  message: 'Refinance offers require interest rate and term',
  path: ['interest_rate'],
});

type OfferFormData = z.infer<typeof offerSchema>;

interface MakeOfferDialogProps {
  loan: Loan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOfferSubmitted: () => void;
}

export function MakeOfferDialog({ loan, open, onOpenChange, onOfferSubmitted }: MakeOfferDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      offer_type: 'refinance',
      offer_amount: Math.min(loan.remaining_balance * 0.9, loan.remaining_balance), // Suggest 10% below remaining
      interest_rate: loan.interest_rate ? Math.max(0, loan.interest_rate - 2) : 15, // Suggest 2% lower
      term_months: 36, // Default 3 years
    },
  });

  const watchOfferType = form.watch('offer_type');

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'EUR' ? 'EUR' : 'USD',
    }).format(amount);
  };

  const onSubmit = async (data: OfferFormData) => {
    try {
      setLoading(true);

      const offerData: CreateLoanOfferRequest = {
        loan_id: loan.id,
        offer_type: data.offer_type,
        offer_amount: data.offer_amount,
        interest_rate: data.interest_rate,
        term_months: data.term_months,
        terms: data.terms,
        conditions: data.conditions,
      };

      const result = await loansService.createLoanOffer(offerData);

      if (result.success) {
        toast.success('Offer submitted successfully!');
        onOfferSubmitted();
        form.reset();
      } else {
        toast.error(result.error || 'Failed to submit offer');
      }
    } catch (error) {
      console.error('Failed to submit offer:', error);
      toast.error('Failed to submit offer');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Make an Offer
          </DialogTitle>
          <DialogDescription>
            Submit an offer to help {loan.lender_name || 'this person'} refinance or pay off their loan
          </DialogDescription>
        </DialogHeader>

        {/* Loan Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{loan.title}</CardTitle>
            <CardDescription>{loan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Remaining Balance</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency(loan.remaining_balance, loan.currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Rate</p>
                <p className="text-lg font-semibold">
                  {loan.interest_rate ? `${loan.interest_rate}%` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Offer Type */}
            <FormField
              control={form.control}
              name="offer_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offer Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="refinance">Refinance - Lower rate, better terms</SelectItem>
                      <SelectItem value="payoff">Payoff - Pay off the loan completely</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose whether you want to refinance with better terms or pay off the loan entirely
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Offer Amount */}
            <FormField
              control={form.control}
              name="offer_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Offer Amount *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter your offer amount"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    {watchOfferType === 'payoff'
                      ? 'Amount you would pay to completely pay off this loan'
                      : 'Amount you would lend to refinance this loan'
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Refinance-specific fields */}
            {watchOfferType === 'refinance' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="interest_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Percent className="h-4 w-4" />
                          Interest Rate *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="12.50"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="term_months"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Term (Months) *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="360"
                            placeholder="36"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {/* Terms and Conditions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your terms..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Describe your specific terms
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conditions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any conditions..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Special conditions or requirements
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Offer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
