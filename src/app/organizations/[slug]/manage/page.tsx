'use client';

import React, { use, useEffect, useState } from 'react';
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

interface ManageOrganizationPageProps {
  params: Promise<{ slug: string }>;
}

interface GroupData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  label: string;
  is_public: boolean;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  voting_weight: number;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface Proposal {
  id: string;
  title: string;
  status: string;
  proposal_type: string;
  proposer_id: string;
  voting_ends_at: string | null;
  voting_results: {
    yes_votes: number;
    no_votes: number;
    abstain_votes: number;
  } | null;
  proposer: {
    name: string | null;
    avatar_url: string | null;
  } | null;
  created_at: string;
}

export default function ManageOrganizationPage({ params }: ManageOrganizationPageProps) {
  const { slug } = use(params);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupRes, membersRes, proposalsRes] = await Promise.all([
          fetch(`/api/groups/${slug}`),
          fetch(`/api/groups/${slug}/members`),
          fetch(`/api/groups/${slug}/proposals?limit=5`),
        ]);

        if (!groupRes.ok) {
          setError('Organization not found');
          return;
        }

        const groupData = await groupRes.json();
        setGroup(groupData.group);

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData.members || []);
        }

        if (proposalsRes.ok) {
          const proposalsData = await proposalsRes.json();
          const proposalsList = proposalsData.data?.proposals || proposalsData.proposals || [];
          setProposals(proposalsList);
        }
      } catch {
        setError('Failed to load organization data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

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

  const activeMembers = members.filter(m => m.status === 'active');
  const activeProposals = proposals.filter(p => p.status === 'active');

  const tabs = [
    { id: 'overview', name: 'Overview', current: true },
    { id: 'stakeholders', name: 'Stakeholders', current: false },
    { id: 'proposals', name: 'Proposals', current: false },
    { id: 'treasury', name: 'Treasury', current: false },
    { id: 'settings', name: 'Settings', current: false },
  ];

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
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">
            <Settings className="w-4 h-4 mr-2" />
            Organization Settings
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <a
              key={tab.id}
              href="#"
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                tab.current
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </a>
          ))}
        </nav>
      </div>

      {/* Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Members Card */}
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

        {/* Active Proposals Card */}
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

        {/* Organization Type Card */}
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
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors">
              <div className="text-center">
                <Plus className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">Add Member</span>
              </div>
            </button>

            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors">
              <div className="text-center">
                <Vote className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">Create Proposal</span>
              </div>
            </button>

            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors">
              <div className="text-center">
                <Wallet className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">Treasury Transfer</span>
              </div>
            </button>

            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors">
              <div className="text-center">
                <Building2 className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">Update Settings</span>
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

                    <div className="flex items-center">
                      {proposal.status === 'passed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Passed
                        </span>
                      )}
                      {proposal.status === 'active' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      )}
                      {proposal.status === 'failed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Failed
                        </span>
                      )}
                      {proposal.status === 'executed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Executed
                        </span>
                      )}
                      {proposal.status === 'draft' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Draft
                        </span>
                      )}
                    </div>
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

        {members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voting Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.slice(0, 5).map(member => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">
                              {(member.display_name || member.username || '?')
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.display_name || member.username || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          member.role === 'owner'
                            ? 'bg-purple-100 text-purple-800'
                            : member.role === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.voting_weight}x
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
