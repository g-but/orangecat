'use client';

import React, { use } from 'react';
import { Wallet, Shield, Clock, Download, Send, Plus, Users, AlertCircle } from 'lucide-react';
import Loading from '@/components/Loading';
import { STATUS } from '@/config/database-constants';
import { useOrganizationData } from '../useOrganizationData';
import { MemberTable } from '../MemberTable';

interface TreasuryPageProps {
  params: Promise<{ slug: string }>;
}

export default function OrganizationTreasuryPage({ params }: TreasuryPageProps) {
  const { slug } = use(params);
  const { group, members, loading, error } = useOrganizationData(slug);

  if (loading) {
    return <Loading fullScreen message="Loading treasury..." />;
  }

  if (error || !group) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">{error || 'Organization not found'}</h3>
        <p className="text-gray-500">Please check the URL and try again.</p>
      </div>
    );
  }

  const activeMembers = members.filter(m => m.status === STATUS.GROUP_MEMBER_STATUS.ACTIVE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treasury Management</h1>
          <p className="text-gray-600">Multi-signature Bitcoin treasury for {group.name}</p>
        </div>
        <div className="flex space-x-3">
          <button
            disabled
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-50 cursor-not-allowed"
            title="Coming soon"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
          <button
            disabled
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-400 cursor-not-allowed"
            title="Coming soon"
          >
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
              <p className="text-sm font-medium text-gray-600">Wallet</p>
              <p className="text-lg font-semibold text-gray-900">
                {group.lightning_address || group.bitcoin_address || 'Not configured'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Members</p>
              <p className="text-2xl font-semibold text-gray-900">{activeMembers.length}</p>
              <p className="text-sm text-gray-500">active members</p>
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
              <p className="text-2xl font-semibold text-gray-500">--</p>
              <p className="text-sm text-gray-400">Coming soon</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className="text-2xl font-semibold text-gray-500">--</p>
              <p className="text-sm text-gray-400">Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Members</h2>
          <p className="text-sm text-gray-600">
            {activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''} in this
            organization
          </p>
        </div>
        <MemberTable members={members} columns={['member', 'role', 'status', 'joined']} />
      </div>

      {/* Transactions - Coming Soon */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
          <p className="text-sm text-gray-600">
            Treasury transactions with multi-sig confirmations
          </p>
        </div>
        <div className="p-12 text-center">
          <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-500 mb-1">Coming Soon</h3>
          <p className="text-sm text-gray-400">
            Transaction tracking will be available when treasury integration is complete.
          </p>
        </div>
      </div>

      {/* Spending Limits - Coming Soon */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Spending Limits</h2>
          <p className="text-sm text-gray-600">
            Automated controls to prevent unauthorized spending
          </p>
        </div>
        <div className="p-12 text-center">
          <Shield className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-500 mb-1">Coming Soon</h3>
          <p className="text-sm text-gray-400">
            Spending limits will be configurable when treasury integration is complete.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Treasury Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              disabled
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
            >
              <div className="text-center">
                <Plus className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">New Transaction</span>
                <span className="block text-xs text-gray-300 mt-1">Coming soon</span>
              </div>
            </button>

            <button
              disabled
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
            >
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">Manage Signers</span>
                <span className="block text-xs text-gray-300 mt-1">Coming soon</span>
              </div>
            </button>

            <button
              disabled
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
            >
              <div className="text-center">
                <Shield className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">Update Limits</span>
                <span className="block text-xs text-gray-300 mt-1">Coming soon</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
