'use client';

/**
 * PayoffDialog
 *
 * Collects payoff/refinance payment info after an offer is accepted.
 * Creates a payment record and marks it completed, with a hook to create a new obligation loan later.
 *
 * Created: 2025-12-04
 * Last Modified: 2025-12-04
 * Last Modified Summary: Initial payoff recording dialog
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/Button';
import { Loader2, DollarSign, CreditCard } from 'lucide-react';
import loansService from '@/services/loans';
import { Loan, LoanOffer } from '@/types/loans';
import { toast } from 'sonner';

const payoffSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.enum(['USD', 'EUR', 'BTC', 'SATS']),
  payment_method: z.enum(['bitcoin', 'lightning', 'bank_transfer', 'card', 'other']),
  notes: z.string().optional(),
});

type PayoffFormData = z.infer<typeof payoffSchema>;

interface PayoffDialogProps {
  loan: Loan;
  offer: LoanOffer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded?: () => void;
}

export function PayoffDialog({ loan, offer, open, onOpenChange, onRecorded }: PayoffDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<PayoffFormData>({
    resolver: zodResolver(payoffSchema),
    defaultValues: {
      amount: offer.offer_amount,
      currency: loan.currency,
      payment_method: 'bank_transfer',
      notes: '',
    },
  });

  const handleSubmit = async (data: PayoffFormData) => {
    try {
      setLoading(true);
      const paymentRequest = {
        loan_id: loan.id,
        offer_id: offer.id,
        amount: data.amount,
        currency: data.currency,
        payment_type: 'payoff' as const,
        recipient_id: loan.user_id, // borrower receives payoff; can extend to external lender later
        transaction_id: undefined,
        payment_method: data.payment_method,
        notes: data.notes,
      };

      const result = await loansService.createPayment(paymentRequest);
      if (!result.success || !result.payment) {
        toast.error(result.error || 'Failed to record payment');
        return;
      }

      // Immediately mark completed for now; future: pending until confirmed
      const completeResult = await loansService.completePayment(result.payment.id);
      if (!completeResult.success) {
        toast.error(completeResult.error || 'Payment recorded but not completed');
        return;
      }

      toast.success('Payoff recorded');
      onRecorded?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error('Failed to record payoff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Record Payoff
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="SATS">SATS</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    Payment Method
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bitcoin">Bitcoin</SelectItem>
                      <SelectItem value="lightning">Lightning</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Transaction ref, confirmations, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Record Payoff
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
