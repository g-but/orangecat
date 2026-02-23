'use client';

import { LoanOffer } from '@/types/loans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Target, TrendingUp, Clock, CheckCircle, XCircle, Edit, MessageSquare } from 'lucide-react';
import { STATUS } from '@/config/database-constants';
import { formatDistanceToNow } from 'date-fns';

interface LoanOffersListProps {
  offers: LoanOffer[];
  onOfferUpdated?: () => void;
}

export function LoanOffersList({ offers, onOfferUpdated: _onOfferUpdated }: LoanOffersListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case STATUS.LOAN_OFFERS.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case STATUS.LOAN_OFFERS.ACCEPTED:
        return 'bg-green-100 text-green-800';
      case STATUS.LOAN_OFFERS.REJECTED:
        return 'bg-red-100 text-red-800';
      case STATUS.LOAN_OFFERS.EXPIRED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case STATUS.LOAN_OFFERS.PENDING:
        return <Clock className="h-4 w-4" />;
      case STATUS.LOAN_OFFERS.ACCEPTED:
        return <CheckCircle className="h-4 w-4" />;
      case STATUS.LOAN_OFFERS.REJECTED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (offers.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold">No offers yet</h3>
        <p className="text-muted-foreground">Your offers will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {offers.map(offer => (
        <Card key={offer.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-lg">
                    {offer.offer_type === 'refinance' ? 'Refinance Offer' : 'Payoff Offer'}
                  </CardTitle>
                  <Badge className={`${getStatusColor(offer.status)} gap-1`}>
                    {getStatusIcon(offer.status)}
                    {offer.status}
                  </Badge>
                </div>
                <CardDescription>
                  Made {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
                </CardDescription>
              </div>
              <div className="flex gap-1">
                {offer.status === STATUS.LOAN_OFFERS.PENDING && (
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Offer Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Offer Amount</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(offer.offer_amount)}
                </p>
              </div>

              {offer.interest_rate && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Interest Rate</p>
                  <p className="text-lg font-semibold">{offer.interest_rate}%</p>
                </div>
              )}

              {offer.term_months && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Term</p>
                  <p className="text-lg font-semibold">{offer.term_months} months</p>
                </div>
              )}

              {offer.monthly_payment && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Monthly Payment</p>
                  <p className="text-lg font-semibold">{formatCurrency(offer.monthly_payment)}</p>
                </div>
              )}
            </div>

            {/* Terms */}
            {offer.terms && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Terms & Conditions</p>
                <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                  {offer.terms}
                </p>
              </div>
            )}

            {/* Status-specific info */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                {offer.status === STATUS.LOAN_OFFERS.PENDING && offer.expires_at && (
                  <span>
                    Expires {formatDistanceToNow(new Date(offer.expires_at), { addSuffix: true })}
                  </span>
                )}
                {offer.status === STATUS.LOAN_OFFERS.ACCEPTED && offer.accepted_at && (
                  <span>
                    Accepted {formatDistanceToNow(new Date(offer.accepted_at), { addSuffix: true })}
                  </span>
                )}
                {offer.status === STATUS.LOAN_OFFERS.REJECTED && offer.rejected_at && (
                  <span>
                    Rejected {formatDistanceToNow(new Date(offer.rejected_at), { addSuffix: true })}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {offer.status === STATUS.LOAN_OFFERS.PENDING && (
                  <>
                    <Button variant="outline" size="sm" className="gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Message
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      Cancel Offer
                    </Button>
                  </>
                )}
                {offer.status === STATUS.LOAN_OFFERS.ACCEPTED && (
                  <Button variant="outline" size="sm" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    View Agreement
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
