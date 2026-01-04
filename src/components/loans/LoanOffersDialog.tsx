'use client';

/**
 * LoanOffersDialog
 *
 * Borrower-facing dialog to review offers on a specific loan and accept/reject them.
 *
 * Created: 2025-12-04
 * Last Modified: 2025-12-04
 * Last Modified Summary: Initial borrower offers review dialog
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Loader2, CheckCircle, XCircle, Target, Clock } from 'lucide-react';
import loansService from '@/services/loans';
import { Loan, LoanOffer } from '@/types/loans';
import { toast } from 'sonner';
import { PayoffDialog } from './PayoffDialog';

interface LoanOffersDialogProps {
  loan: Loan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOfferUpdated?: () => void;
}

export function LoanOffersDialog({
  loan,
  open,
  onOpenChange,
  onOfferUpdated,
}: LoanOffersDialogProps) {
  const [offers, setOffers] = useState<LoanOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [payoffLoan, setPayoffLoan] = useState<Loan | null>(null);
  const [payoffOffer, setPayoffOffer] = useState<LoanOffer | null>(null);
  const [payoffOpen, setPayoffOpen] = useState(false);

  useEffect(() => {
    if (open) {
      void loadOffers();
    }
  }, [open]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const result = await loansService.getLoanOffers(loan.id);
      if (result.success) {
        setOffers(result.offers || []);
      } else {
        toast.error(result.error || 'Failed to load offers');
      }
    } catch (error) {
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (offerId: string, accept: boolean) => {
    try {
      setActioningId(offerId);
      const result = await loansService.respondToOffer(offerId, accept);
      if (result.success) {
        toast.success(accept ? 'Offer accepted' : 'Offer rejected');
        await loadOffers();
        // If accepted, open payoff dialog so borrower can record payoff
        if (accept) {
          const accepted = offers.find(o => o.id === offerId);
          if (accepted) {
            setPayoffLoan(loan);
            setPayoffOffer(accepted);
            setPayoffOpen(true);
          }
        }
        onOfferUpdated?.();
      } else {
        toast.error(result.error || 'Failed to update offer');
      }
    } catch (error) {
      toast.error('Failed to update offer');
    } finally {
      setActioningId(null);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'EUR' ? 'EUR' : 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Offers for {loan.title}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading offers...
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No offers yet. Share your loan to attract lenders.
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map(offer => (
              <Card key={offer.id}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(offer.status)}>{offer.status}</Badge>
                        {offer.offer_type === 'refinance' ? (
                          <Badge variant="secondary">Refinance</Badge>
                        ) : (
                          <Badge variant="secondary">Payoff</Badge>
                        )}
                      </div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(offer.offer_amount, loan.currency)}
                      </div>
                      {offer.interest_rate && (
                        <div className="text-sm text-muted-foreground">
                          Rate: {offer.interest_rate}% | Term: {offer.term_months ?? '-'} months
                        </div>
                      )}
                      {offer.terms && (
                        <div className="text-sm text-muted-foreground">Terms: {offer.terms}</div>
                      )}
                    </div>
                    {offer.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRespond(offer.id, false)}
                          disabled={actioningId === offer.id}
                        >
                          {actioningId === offer.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRespond(offer.id, true)}
                          disabled={actioningId === offer.id}
                        >
                          {actioningId === offer.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Accept
                        </Button>
                      </div>
                    )}
                    {offer.status !== 'pending' && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Updated {new Date(offer.updated_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {payoffLoan && payoffOffer && (
          <PayoffDialog
            loan={payoffLoan}
            offer={payoffOffer}
            open={payoffOpen}
            onOpenChange={setPayoffOpen}
            onRecorded={() => {
              setPayoffLoan(null);
              setPayoffOffer(null);
              void loadOffers();
              onOfferUpdated?.();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}



