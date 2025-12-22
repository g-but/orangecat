'use client';

import { Loan, LoanStats } from '@/types/loans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  Percent,
  Calendar,
  Target,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { LoanOffersDialog } from './LoanOffersDialog';
import { toast } from 'sonner';
import loansService from '@/services/loans';
import { CreateLoanDialog } from './CreateLoanDialog';

interface LoanListProps {
  loans: Loan[];
  onLoanUpdated?: () => void;
}

export function LoanList({ loans, onLoanUpdated }: LoanListProps) {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [offersDialogOpen, setOffersDialogOpen] = useState(false);
  const [editLoan, setEditLoan] = useState<Loan | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paid_off':
        return 'bg-blue-100 text-blue-800';
      case 'refinanced':
        return 'bg-purple-100 text-purple-800';
      case 'defaulted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    if (currency === 'BTC') {
      return `${(amount / 100000000).toFixed(8)} BTC`;
    }
    if (currency === 'SATS') {
      return `${amount.toLocaleString()} SATS`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'EUR' ? 'EUR' : 'USD',
    }).format(amount);
  };

  const calculateProgress = (original: number, remaining: number) => {
    if (original === 0) {
      return 0;
    }
    return ((original - remaining) / original) * 100;
  };

  const handleToggleVisibility = async (loan: Loan) => {
    try {
      const result = await loansService.updateLoan(loan.id, { is_public: !loan.is_public });
      if (result.success) {
        toast.success(loan.is_public ? 'Loan hidden' : 'Loan made public');
        onLoanUpdated?.();
      } else {
        toast.error(result.error || 'Failed to update visibility');
      }
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  const handleViewOffers = (loan: Loan) => {
    setSelectedLoan(loan);
    setOffersDialogOpen(true);
  };

  const handleDelete = async (loan: Loan) => {
    const confirmed = window.confirm('Delete this loan? This cannot be undone.');
    if (!confirmed) {
      return;
    }
    try {
      const result = await loansService.deleteLoan(loan.id);
      if (result.success) {
        toast.success('Loan deleted');
        onLoanUpdated?.();
      } else {
        toast.error(result.error || 'Failed to delete loan');
      }
    } catch (error) {
      toast.error('Failed to delete loan');
    }
  };

  const handleEdit = (loan: Loan) => {
    setEditLoan(loan);
    setEditDialogOpen(true);
  };

  if (loans.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold">No loans yet</h3>
        <p className="text-muted-foreground">Add your first loan to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loans.map(loan => {
        const progress = calculateProgress(loan.original_amount, loan.remaining_balance);

        return (
          <Card key={loan.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-lg">{loan.title}</CardTitle>
                    <Badge className={getStatusColor(loan.status)}>
                      {loan.status.replace('_', ' ')}
                    </Badge>
                    {loan.is_public ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {loan.description || 'No description provided'}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Financial Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Remaining Balance</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(loan.remaining_balance, loan.currency)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Original Amount</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(loan.original_amount, loan.currency)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Interest Rate</p>
                  <p className="text-lg font-semibold flex items-center gap-1">
                    {loan.interest_rate ? (
                      <>
                        <Percent className="h-3 w-3" />
                        {loan.interest_rate}%
                      </>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Monthly Payment</p>
                  <p className="text-lg font-semibold">
                    {loan.monthly_payment
                      ? formatCurrency(loan.monthly_payment, loan.currency)
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Payoff Progress</span>
                  <span>{progress.toFixed(1)}% paid</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Loan Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-2">
                  {loan.lender_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Lender:</span>
                      <span>{loan.lender_name}</span>
                    </div>
                  )}
                  {loan.origination_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Originated:</span>
                      <span>{new Date(loan.origination_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Listed:</span>
                    <span>
                      {formatDistanceToNow(new Date(loan.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {loan.minimum_offer_amount && (
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Min offer:</span>
                      <span>{formatCurrency(loan.minimum_offer_amount, loan.currency)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Negotiable:</span>
                    <Badge variant={loan.is_negotiable ? 'default' : 'secondary'}>
                      {loan.is_negotiable ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Offers:</span>
                    <span className="font-medium">0</span> {/* TODO: Add actual count */}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleViewOffers(loan)}
                >
                  <MessageSquare className="h-4 w-4" />
                  View Offers
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleEdit(loan)}
                >
                  <TrendingUp className="h-4 w-4" />
                  Edit Loan
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleToggleVisibility(loan)}>
                  {loan.is_public ? 'Make Private' : 'Make Public'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(loan)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {selectedLoan && (
        <LoanOffersDialog
          loan={selectedLoan}
          open={offersDialogOpen}
          onOpenChange={setOffersDialogOpen}
          onOfferUpdated={onLoanUpdated}
        />
      )}

      {editLoan && (
        <CreateLoanDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          mode="edit"
          loanId={editLoan.id}
          initialValues={editLoan}
          onLoanUpdated={() => {
            setEditLoan(null);
            setEditDialogOpen(false);
            onLoanUpdated?.();
          }}
          onLoanCreated={() => {}}
        />
      )}
    </div>
  );
}
