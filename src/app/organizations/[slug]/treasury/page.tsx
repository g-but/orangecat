import React from 'react';
import { Metadata } from 'next';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Shield,
  Clock,
  CheckCircle,
  Plus,
  Send,
  Download,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Organization Treasury - OrangeCat',
  description:
    "Manage your organization's multi-signature Bitcoin treasury with transparent governance.",
};

interface TreasuryPageProps {
  params: {
    slug: string;
  };
}

export default function OrganizationTreasuryPage({ params }: TreasuryPageProps) {
  const { slug } = params;

  // Mock treasury data
  const treasury = {
    balance: '₿ 50.25',
    usdValue: '$2,125,000',
    multiSig: '3-of-5',
    signers: 5,
    pendingTransactions: 2,
    monthlySpending: '₿ 8.5',
  };

  const signers = [
    { name: 'Alex Chen', role: 'Founder', status: 'active', lastActive: '2 hours ago' },
    { name: 'Maria Rodriguez', role: 'Founder', status: 'active', lastActive: '1 hour ago' },
    { name: 'David Kim', role: 'Founder', status: 'active', lastActive: '30 min ago' },
    { name: 'Sarah Johnson', role: 'Employee', status: 'active', lastActive: '4 hours ago' },
    { name: 'Mike Chen', role: 'Employee', status: 'inactive', lastActive: '2 days ago' },
  ];

  const transactions = [
    {
      id: 'tx-001',
      type: 'incoming',
      amount: '₿ 25.0',
      description: 'Investment from Series A',
      status: 'confirmed',
      date: '2025-12-20',
      confirmations: 6,
      signers: '3/3',
    },
    {
      id: 'tx-002',
      type: 'outgoing',
      amount: '₿ 2.5',
      description: 'Office rent payment',
      status: 'confirmed',
      date: '2025-12-18',
      confirmations: 12,
      signers: '3/3',
    },
    {
      id: 'tx-003',
      type: 'outgoing',
      amount: '₿ 12.8',
      description: 'Employee salaries',
      status: 'pending',
      date: '2025-12-15',
      confirmations: 0,
      signers: '2/3',
    },
    {
      id: 'tx-004',
      type: 'incoming',
      amount: '₿ 1.2',
      description: 'Service revenue',
      status: 'confirmed',
      date: '2025-12-14',
      confirmations: 8,
      signers: '3/3',
    },
  ];

  const spendingLimits = [
    { category: 'Operations', limit: '₿ 5.0', used: '₿ 2.1', period: 'Daily' },
    { category: 'Salaries', limit: '₿ 15.0', used: '₿ 12.8', period: 'Monthly' },
    { category: 'Investments', limit: '₿ 50.0', used: '₿ 0.0', period: 'Quarterly' },
    { category: 'Legal', limit: '₿ 10.0', used: '₿ 3.2', period: 'Monthly' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treasury Management</h1>
          <p className="text-gray-600">Multi-signature Bitcoin treasury with governance controls</p>
        </div>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">
            <Send className="w-4 h-4 mr-2" />
            New Transaction
          </button>
        </div>
      </div>

      {/* Treasury Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wallet className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className="text-2xl font-semibold text-gray-900">{treasury.balance}</p>
              <p className="text-sm text-gray-500">{treasury.usdValue}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Multi-Sig Security</p>
              <p className="text-2xl font-semibold text-gray-900">{treasury.multiSig}</p>
              <p className="text-sm text-gray-500">{treasury.signers} authorized signers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Transactions</p>
              <p className="text-2xl font-semibold text-gray-900">{treasury.pendingTransactions}</p>
              <p className="text-sm text-gray-500">Awaiting signatures</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowDownLeft className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Spending</p>
              <p className="text-2xl font-semibold text-gray-900">{treasury.monthlySpending}</p>
              <p className="text-sm text-gray-500">This month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Sig Signers */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Authorized Signers</h2>
          <p className="text-sm text-gray-600">
            Multi-signature wallet requires 3 of 5 signers for transactions
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Signer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {signers.map((signer, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {signer.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{signer.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        signer.role === 'Founder'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {signer.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        signer.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {signer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {signer.lastActive}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-orange-600 hover:text-orange-900 mr-4">Replace</button>
                    <button className="text-red-600 hover:text-red-900">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spending Limits */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Spending Limits</h2>
          <p className="text-sm text-gray-600">
            Automated controls to prevent unauthorized spending
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {spendingLimits.map((limit, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{limit.category}</h3>
                    <p className="text-sm text-gray-500">{limit.period} limit</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Used / Limit</div>
                    <div className="font-medium">
                      {limit.used} / {limit.limit}
                    </div>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{
                      width: `${(parseFloat(limit.used.replace('₿ ', '')) / parseFloat(limit.limit.replace('₿ ', ''))) * 100}%`,
                    }}
                  ></div>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  {(
                    (parseFloat(limit.used.replace('₿ ', '')) /
                      parseFloat(limit.limit.replace('₿ ', ''))) *
                    100
                  ).toFixed(1)}
                  % utilized
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
          <p className="text-sm text-gray-600">
            All treasury transactions with multi-sig confirmations
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Signers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.type === 'incoming' ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        {tx.type === 'incoming' ? (
                          <ArrowDownLeft className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{tx.description}</div>
                        <div className="text-sm text-gray-500">{tx.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tx.type === 'incoming'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tx.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tx.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {tx.status === 'confirmed' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {tx.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tx.signers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Treasury Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors">
              <div className="text-center">
                <Plus className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">New Transaction</span>
              </div>
            </button>

            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">Manage Signers</span>
              </div>
            </button>

            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors">
              <div className="text-center">
                <Shield className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">Update Limits</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
