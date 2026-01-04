/**
 * Public Loan Detail Page
 *
 * Displays loan details for public loans.
 * Allows anyone to view public loans listed on the platform.
 *
 * Created: 2025-12-31
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DollarSign, ArrowLeft, Percent, TrendingUp, User, Calendar, Clock, MessageSquare } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Button from '@/components/ui/Button';
import { formatDistanceToNow, format } from 'date-fns';
import type { Loan } from '@/types/loans';

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatCurrency(amount: number, currency: string = 'USD') {
  if (currency === 'BTC') {
    return `${(amount / 100000000).toFixed(8)} BTC`;
  }
  if (currency === 'SATS') {
    return `${amount.toLocaleString()} SATS`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'EUR' ? 'EUR' : currency === 'CHF' ? 'CHF' : 'USD',
  }).format(amount);
}

function calculateProgress(original: number, remaining: number) {
  if (original === 0) {
    return 0;
  }
  return ((original - remaining) / original) * 100;
}

export default async function PublicLoanDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Fetch public loan with owner profile
  const { data: loan, error } = await supabase
    .from('loans')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        name,
        avatar_url
      )
    `)
    .eq('id', id)
    .eq('is_public', true)
    .single();

  if (error || !loan) {
    notFound();
  }

  const progress = calculateProgress(loan.original_amount, loan.remaining_balance);
  const owner = loan.profiles as { id: string; username: string | null; name: string | null; avatar_url: string | null } | null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-tiffany-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/discover?type=loans"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Loans
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{loan.title}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge
                    variant={loan.status === 'active' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {loan.status}
                  </Badge>
                  <span className="text-gray-500 text-sm">
                    Listed {formatDistanceToNow(new Date(loan.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {loan.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About this Loan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{loan.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Financial Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Remaining Balance</span>
                    <span className="font-bold text-xl text-blue-600">
                      {formatCurrency(loan.remaining_balance, loan.currency)}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{progress.toFixed(1)}% funded</span>
                    <span>Original: {formatCurrency(loan.original_amount, loan.currency)}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {loan.interest_rate !== null && loan.interest_rate !== undefined && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Percent className="w-4 h-4" />
                        Interest Rate
                      </div>
                      <div className="font-semibold text-lg">{loan.interest_rate}% APR</div>
                    </div>
                  )}
                  {loan.monthly_payment && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <TrendingUp className="w-4 h-4" />
                        Monthly Payment
                      </div>
                      <div className="font-semibold text-lg">
                        {formatCurrency(loan.monthly_payment, loan.currency)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Current Lender */}
                {loan.lender_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 border-t pt-4">
                    <User className="w-4 h-4" />
                    <span>Current Lender: {loan.lender_name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Terms & Conditions */}
            {loan.preferred_terms && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preferred Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{loan.preferred_terms}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Card */}
            {owner && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Listed By</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/profiles/${owner.username || owner.id}`}
                    className="flex items-center gap-3 hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
                  >
                    {owner.avatar_url ? (
                      <img
                        src={owner.avatar_url}
                        alt={owner.name || owner.username || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {owner.name || owner.username || 'Anonymous'}
                      </div>
                      {owner.username && (
                        <div className="text-sm text-gray-500">@{owner.username}</div>
                      )}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Loan Type</span>
                  <Badge variant="secondary" className="capitalize">
                    {loan.loan_category_id || 'General'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Negotiable</span>
                  <span className="font-medium">
                    {loan.is_negotiable ? 'Yes' : 'No'}
                  </span>
                </div>
                {loan.minimum_offer_amount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Min Offer</span>
                    <span className="font-medium">
                      {formatCurrency(loan.minimum_offer_amount, loan.currency)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Contact Method</span>
                  <span className="font-medium capitalize">
                    {loan.contact_method || 'Platform'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Link href="/auth?mode=login&from=/loans" className="block">
                  <Button className="w-full gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Contact Lister
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 text-center">
                  Sign in to contact the loan lister or make an offer
                </p>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardContent className="pt-6 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Created {format(new Date(loan.created_at), 'MMM d, yyyy')}</span>
                </div>
                {loan.updated_at && loan.updated_at !== loan.created_at && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Updated {formatDistanceToNow(new Date(loan.updated_at), { addSuffix: true })}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
