'use client';

import { useState } from 'react';
import { Loan } from '@/types/loans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Percent, Target, TrendingUp, User, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MakeOfferDialog } from './MakeOfferDialog';
import { formatCurrency } from '@/services/currency';
import { PLATFORM_DEFAULT_CURRENCY, CURRENCY_CODES } from '@/config/currencies';
import type { CurrencyCode } from '@/config/currencies';

interface AvailableLoansProps {
  loans: Loan[];
  onOfferMade?: () => void;
}

export function AvailableLoans({ loans, onOfferMade }: AvailableLoansProps) {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);

  const formatLoanAmount = (amount: number, currency: string = PLATFORM_DEFAULT_CURRENCY) => {
    // Validate currency and fallback to platform default
    const validCurrency = (CURRENCY_CODES.includes(currency as CurrencyCode) ? currency : PLATFORM_DEFAULT_CURRENCY) as CurrencyCode;
    return formatCurrency(amount, validCurrency);
  };

  const calculateProgress = (original: number, remaining: number) => {
    if (original === 0) {
      return 0;
    }
    return ((original - remaining) / original) * 100;
  };

  const handleMakeOffer = (loan: Loan) => {
    setSelectedLoan(loan);
    setOfferDialogOpen(true);
  };

  const handleOfferSubmitted = () => {
    setOfferDialogOpen(false);
    setSelectedLoan(null);
    onOfferMade?.();
  };

  if (loans.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold">No loans available</h3>
        <p className="text-muted-foreground">Check back later for new listings</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loans.map(loan => {
          const progress = calculateProgress(loan.original_amount, loan.remaining_balance);

          return (
            <Card key={loan.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{loan.title}</CardTitle>
                    <CardDescription className="text-xs">
                      Listed {formatDistanceToNow(new Date(loan.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Financial Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Remaining</span>
                    <span className="font-semibold text-red-600">
                      {formatLoanAmount(loan.remaining_balance, loan.currency)}
                    </span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress.toFixed(0)}% paid</span>
                    <span>{formatLoanAmount(loan.original_amount, loan.currency)} total</span>
                  </div>
                </div>

                {/* Interest Rate */}
                {loan.interest_rate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rate</span>
                    <Badge variant="secondary" className="gap-1">
                      <Percent className="h-3 w-3" />
                      {loan.interest_rate}%
                    </Badge>
                  </div>
                )}

                {/* Monthly Payment */}
                {loan.monthly_payment && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Monthly</span>
                    <span className="font-medium">
                      {formatLoanAmount(loan.monthly_payment, loan.currency)}
                    </span>
                  </div>
                )}

                {/* Lender Info */}
                {loan.lender_name && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">{loan.lender_name}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1 gap-1" onClick={() => handleMakeOffer(loan)}>
                    <Target className="h-3 w-3" />
                    Make Offer
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Make Offer Dialog */}
      {selectedLoan && (
        <MakeOfferDialog
          loan={selectedLoan}
          open={offerDialogOpen}
          onOpenChange={setOfferDialogOpen}
          onOfferSubmitted={handleOfferSubmitted}
        />
      )}
    </>
  );
}
