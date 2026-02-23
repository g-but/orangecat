'use client';

import React, { use } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  Vote,
  Wallet,
  Settings,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import Loading from '@/components/Loading';
import { STATUS } from '@/config/database-constants';
import { useOrganizationData } from '../useOrganizationData';
import { MemberTable } from '../MemberTable';

interface ManageOrganizationPageProps {
  params: Promise<{ slug: string }>;
}

export default function ManageOrganizationPage({ params }: ManageOrganizationPageProps) {
  const { slug } = use(params);
  const { group, members, proposals, loading, error } = useOrganizationData(slug, {
    fetchProposals: true,
  });

  if (loading) {
    return <Loading fullScreen message="Loading organization..." />;
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
  const activeProposals = proposals.filter(p => p.status === STATUS.PROPOSALS.ACTIVE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage {group.name}</h1>
          <p className="text-gray-600">
            {group.description || 'Organization administration and governance'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/organizations/${slug}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Public Page
          </Link>
          <button
            disabled
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-400 cursor-not-allowed"
            title="Coming soon"
          >
            <Settings className="w-4 h-4 mr-2" />
            Organization Settings
          </button>
        </div>
      </div>

      {/* Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-semibold text-gray-900">{members.length}</p>
              <p className="text-sm text-gray-500">{activeMembers.length} active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Vote className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Proposals</p>
              <p className="text-2xl font-semibold text-gray-900">{activeProposals.length}</p>
              <p className="text-sm text-gray-500">{proposals.length} total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Type</p>
              <p className="text-2xl font-semibold text-gray-900 capitalize">{group.label}</p>
              <p className="text-sm text-gray-500">{group.is_public ? 'Public' : 'Private'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              disabled
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
            >
              <div className="text-center">
                <Plus className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">Add Member</span>
                <span className="block text-xs text-gray-300 mt-1">Coming soon</span>
              </div>
            </button>

            <button
              disabled
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
            >
              <div className="text-center">
                <Vote className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">Create Proposal</span>
                <span className="block text-xs text-gray-300 mt-1">Coming soon</span>
              </div>
            </button>

            <button
              disabled
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
            >
              <div className="text-center">
                <Wallet className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">Treasury Transfer</span>
                <span className="block text-xs text-gray-300 mt-1">Coming soon</span>
              </div>
            </button>

            <button
              disabled
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
            >
              <div className="text-center">
                <Building2 className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">Update Settings</span>
                <span className="block text-xs text-gray-300 mt-1">Coming soon</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Proposals */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Recent Proposals</h2>
          <Link
            href={`/organizations/${slug}/proposals`}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            View all proposals
          </Link>
        </div>

        {proposals.length === 0 ? (
          <div className="p-12 text-center">
            <Vote className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No proposals yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {proposals.map(proposal => (
              <div key={proposal.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{proposal.title}</h3>
                    <p className="text-sm text-gray-500">
                      {proposal.proposer?.name || 'Unknown'} &middot;{' '}
                      {new Date(proposal.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    {proposal.voting_results && (
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Votes</div>
                        <div className="text-sm font-medium">
                          {proposal.voting_results.yes_votes}Y / {proposal.voting_results.no_votes}N
                          / {proposal.voting_results.abstain_votes}A
                        </div>
                      </div>
                    )}

                    <ProposalStatusBadge status={proposal.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Members</h2>
          <Link
            href={`/organizations/${slug}/stakeholders`}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Manage members
          </Link>
        </div>
        <MemberTable
          members={members}
          limit={5}
          columns={['member', 'role', 'votingWeight', 'joined']}
        />
      </div>
    </div>
  );
}

function ProposalStatusBadge({ status }: { status: string }) {
  switch (status) {
    case STATUS.PROPOSALS.PASSED:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Passed
        </span>
      );
    case STATUS.PROPOSALS.ACTIVE:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    case STATUS.PROPOSALS.FAILED:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Failed
        </span>
      );
    case STATUS.PROPOSALS.EXECUTED:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Executed
        </span>
      );
    case STATUS.PROPOSALS.DRAFT:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Draft
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
}
