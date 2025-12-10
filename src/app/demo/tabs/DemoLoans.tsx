'use client';

/**
 * DEMO LOANS TAB
 *
 * Shows peer-to-peer lending marketplace with refinancing offers.
 */

import { DollarSign, TrendingUp, Target, GraduationCap, Car } from 'lucide-react';
import {
  type DemoLoan,
  type DemoAvailableLoan,
  formatUSD,
  getStatusBadgeColor,
} from '@/data/demo';

interface DemoLoansProps {
  loans: DemoLoan[];
  availableLoans: DemoAvailableLoan[];
}

export function DemoLoans({ loans, availableLoans }: DemoLoansProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">My Loans</h2>
          <p className="text-gray-600">
            List loans for refinancing or browse lending opportunities
          </p>
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors">
          <DollarSign className="w-4 h-4" />
          List New Loan
        </button>
      </div>

      {/* User's Loans */}
      {loans.map((loan) => (
        <LoanCard key={loan.id} loan={loan} />
      ))}

      {/* Browse Available Loans */}
      <AvailableLoansSection loans={availableLoans} />
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

interface LoanCardProps {
  loan: DemoLoan;
}

function LoanCard({ loan }: LoanCardProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 md:p-6 border-b">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold">{loan.title}</h3>
            <p className="text-gray-600">
              {loan.lender} • {loan.status}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-red-600">
              {formatUSD(loan.remainingBalance)}
            </p>
            <p className="text-sm text-gray-600">
              {formatUSD(loan.monthlyPayment)}/month
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Loan Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-lg font-semibold">{formatUSD(loan.remainingBalance)}</p>
            <p className="text-xs text-gray-600">Remaining Balance</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-lg font-semibold">{loan.interestRate}%</p>
            <p className="text-xs text-gray-600">Current Rate</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-lg font-semibold">{loan.offers.length}</p>
            <p className="text-xs text-gray-600">Active Offers</p>
          </div>
        </div>

        {/* Refinancing Offers */}
        <div className="space-y-4">
          <h4 className="font-semibold">Refinancing Offers</h4>
          {loan.offers.map((offer) => (
            <div key={offer.id} className="border rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{offer.avatar}</span>
                  <div>
                    <p className="font-medium">{offer.offerer}</p>
                    <p className="text-sm text-gray-600">
                      {formatUSD(offer.amount)} at {offer.rate}% for {offer.term} months
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded text-sm ${getStatusBadgeColor(offer.status)}`}>
                  {offer.status}
                </div>
              </div>
              <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
                <span className="text-gray-600">
                  Monthly: {formatUSD(offer.monthlyPayment)}
                </span>
                {offer.status === 'pending' && (
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors">
                      Accept
                    </button>
                    <button className="px-3 py-1 border rounded text-xs hover:bg-gray-50 transition-colors">
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface AvailableLoansSectionProps {
  loans: DemoAvailableLoan[];
}

function AvailableLoansSection({ loans }: AvailableLoansSectionProps) {
  const iconMap: Record<string, typeof GraduationCap> = {
    'Student Loan': GraduationCap,
    'Auto Loan': Car,
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 md:p-6 border-b">
        <h3 className="font-semibold">Browse Available Loans</h3>
        <p className="text-sm text-gray-600">
          Help others refinance and earn competitive returns
        </p>
      </div>
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loans.map((loan) => {
            const Icon = iconMap[loan.type] || DollarSign;
            return (
              <div key={loan.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">
                    {loan.type} - {formatUSD(loan.amount)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{loan.description}</p>
                <div className="flex justify-between text-sm mb-3">
                  <span>Current: {loan.currentRate}% APR</span>
                  <span>Monthly: {formatUSD(loan.monthlyPayment)}</span>
                </div>
                <button className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                  Make Offer
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



























