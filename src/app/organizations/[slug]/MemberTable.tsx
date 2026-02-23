import Image from 'next/image';
import { Users } from 'lucide-react';
import { STATUS } from '@/config/database-constants';
import type { OrganizationMember } from './types';

interface MemberTableProps {
  members: OrganizationMember[];
  limit?: number;
  columns?: ('member' | 'role' | 'status' | 'votingWeight' | 'joined')[];
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
};
const DEFAULT_ROLE_COLOR = 'bg-gray-100 text-gray-800';

function MemberAvatar({ member }: { member: OrganizationMember }) {
  const initial = (member.display_name || member.username || '?').charAt(0).toUpperCase();

  if (member.avatar_url) {
    return (
      <Image
        src={member.avatar_url}
        alt=""
        width={32}
        height={32}
        className="w-8 h-8 rounded-full"
      />
    );
  }

  return <span className="text-sm font-medium text-gray-600">{initial}</span>;
}

export function MemberTable({
  members,
  limit,
  columns = ['member', 'role', 'status', 'joined'],
}: MemberTableProps) {
  const displayMembers = limit ? members.slice(0, limit) : members;

  if (members.length === 0) {
    return (
      <div className="p-12 text-center">
        <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No members found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.includes('member') && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member
              </th>
            )}
            {columns.includes('role') && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
            )}
            {columns.includes('status') && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            )}
            {columns.includes('votingWeight') && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Voting Weight
              </th>
            )}
            {columns.includes('joined') && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {displayMembers.map(member => (
            <tr key={member.id}>
              {columns.includes('member') && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <MemberAvatar member={member} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {member.display_name || member.username || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </td>
              )}
              {columns.includes('role') && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ROLE_COLORS[member.role] || DEFAULT_ROLE_COLOR}`}
                  >
                    {member.role}
                  </span>
                </td>
              )}
              {columns.includes('status') && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      member.status === STATUS.GROUP_MEMBER_STATUS.ACTIVE
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
              )}
              {columns.includes('votingWeight') && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {member.voting_weight}x
                </td>
              )}
              {columns.includes('joined') && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(member.joined_at).toLocaleDateString()}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
