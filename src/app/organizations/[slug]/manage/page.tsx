import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  Building2,
  Users,
  Vote,
  Wallet,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Manage Organization - OrangeCat',
  description: 'Manage stakeholders, proposals, treasury, and governance for your organization.',
};

interface ManageOrganizationPageProps {
  params: {
    slug: string;
  };
}

export default function ManageOrganizationPage({ params }: ManageOrganizationPageProps) {
  const { slug } = params;

  // Mock data - will be replaced with real API calls
  const organization = {
    id: slug,
    name: slug === 'bitbaum' ? 'BitBaum AG' : 'Martian Sovereignty Initiative',
    type: slug === 'bitbaum' ? 'Company' : 'Non-Profit',
    description: slug === 'bitbaum'
      ? 'Growing Bitcoin communities through transparent commerce'
      : 'Raising Bitcoin to purchase sovereignty over Valles territory',
    treasury: slug === 'bitbaum' ? '₿ 50.25' : '₿ 245,000',
    stakeholders: slug === 'bitbaum' ? 25 : 156,
    transparencyScore: slug === 'bitbaum' ? 98 : 95,
    isPublic: true,
  };

  const stakeholders = [
    { id: 1, name: 'Alex Chen', role: 'Founder', email: 'alex@bitbaum.com', votingWeight: 3.0, joinedAt: '2025-01-01' },
    { id: 2, name: 'Maria Rodriguez', role: 'Founder', email: 'maria@bitbaum.com', votingWeight: 3.0, joinedAt: '2025-01-01' },
    { id: 3, name: 'David Kim', role: 'Founder', email: 'david@bitbaum.com', votingWeight: 3.0, joinedAt: '2025-01-01' },
    { id: 4, name: 'Sarah Johnson', role: 'Employee', email: 'sarah@bitbaum.com', votingWeight: 1.0, joinedAt: '2025-02-01' },
    { id: 5, name: 'Mike Chen', role: 'Employee', email: 'mike@bitbaum.com', votingWeight: 1.0, joinedAt: '2025-02-15' },
  ];

  const recentProposals = [
    {
      id: 1,
      title: 'Q1 2026 Budget Approval',
      status: 'passed',
      votes: { yes: 18, no: 2, abstain: 0 },
      endDate: '2025-12-20',
      createdBy: 'Alex Chen'
    },
    {
      id: 2,
      title: 'New Office Space Lease',
      status: 'active',
      votes: { yes: 12, no: 3, abstain: 1 },
      endDate: '2025-12-25',
      createdBy: 'Maria Rodriguez'
    },
    {
      id: 3,
      title: 'Partnership with Local University',
      status: 'passed',
      votes: { yes: 15, no: 0, abstain: 0 },
      endDate: '2025-12-18',
      createdBy: 'David Kim'
    }
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Manage {organization.name}</h1>
          <p className="text-gray-600">Organization administration and governance</p>
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
          {tabs.map((tab) => (
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Treasury Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Treasury Balance</p>
              <p className="text-2xl font-semibold text-gray-900">{organization.treasury}</p>
            </div>
          </div>
        </div>

        {/* Stakeholders Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Stakeholders</p>
              <p className="text-2xl font-semibold text-gray-900">{organization.stakeholders}</p>
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
              <p className="text-2xl font-semibold text-gray-900">
                {recentProposals.filter(p => p.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        {/* Transparency Score Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transparency Score</p>
              <p className="text-2xl font-semibold text-gray-900">{organization.transparencyScore}%</p>
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
                <span className="text-sm font-medium">Add Stakeholder</span>
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
            View all proposals →
          </Link>
        </div>

        <div className="divide-y divide-gray-200">
          {recentProposals.map((proposal) => (
            <div key={proposal.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{proposal.title}</h3>
                  <p className="text-sm text-gray-500">Created by {proposal.createdBy}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Votes</div>
                    <div className="text-sm font-medium">
                      {proposal.votes.yes}Y / {proposal.votes.no}N / {proposal.votes.abstain}A
                    </div>
                  </div>

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
                  </div>

                  <div className="text-sm text-gray-500">
                    Ends {proposal.endDate}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stakeholders Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Stakeholders</h2>
          <Link
            href={`/organizations/${slug}/stakeholders`}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Manage stakeholders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stakeholder
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stakeholders.slice(0, 5).map((stakeholder) => (
                <tr key={stakeholder.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {stakeholder.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{stakeholder.name}</div>
                        <div className="text-sm text-gray-500">{stakeholder.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      stakeholder.role === 'Founder'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {stakeholder.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {stakeholder.votingWeight}x
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(stakeholder.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-orange-600 hover:text-orange-900 mr-4">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



