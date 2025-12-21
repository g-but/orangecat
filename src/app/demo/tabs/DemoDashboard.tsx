'use client';

/**
 * DEMO DASHBOARD TAB
 *
 * Shows user overview with stats, recent activity, and active projects.
 */

import { Bitcoin, Users, DollarSign, Star, Heart, MessageCircle } from 'lucide-react';
import {
  type DemoUser,
  type DemoTimelineEvent,
  type DemoProject,
  formatSats,
  formatUSD,
} from '@/data/demo';

interface DemoDashboardProps {
  user: DemoUser;
  timeline: DemoTimelineEvent[];
  projects: DemoProject[];
}

export function DemoDashboard({ user, timeline, projects }: DemoDashboardProps) {
  return (
    <div className="space-y-8">
      {/* User Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          icon={Bitcoin}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          label="Balance"
          value={formatSats(user.balance)}
          subValue={formatUSD(user.balance)}
        />
        <StatCard
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Circles"
          value={user.circleCount.toString()}
          subValue="Active memberships"
        />
        <StatCard
          icon={DollarSign}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          label="Loans"
          value={user.loanCount.toString()}
          subValue="Active listings"
        />
        <StatCard
          icon={Star}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          label="Reputation"
          value={user.reputation.toString()}
          subValue="Community rating"
        />
      </div>

      {/* Recent Activity & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivityCard timeline={timeline.slice(0, 3)} />
        <ActiveProjectsCard projects={projects} />
      </div>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

interface StatCardProps {
  icon: typeof Bitcoin;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  subValue: string;
}

function StatCard({ icon: Icon, iconBg, iconColor, label, value, subValue }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-4 md:p-6 border shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 ${iconBg} rounded-lg`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-xl md:text-2xl font-bold truncate">{value}</p>
          <p className="text-xs text-gray-500 truncate">{subValue}</p>
        </div>
      </div>
    </div>
  );
}

interface RecentActivityCardProps {
  timeline: DemoTimelineEvent[];
}

function RecentActivityCard({ timeline }: RecentActivityCardProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 md:p-6 border-b">
        <h3 className="font-semibold">Recent Activity</h3>
        <p className="text-sm text-gray-600">Your latest interactions</p>
      </div>
      <div className="p-4 md:p-6 space-y-4">
        {timeline.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 pb-4 border-b last:border-b-0 last:pb-0"
          >
            <div className="text-lg flex-shrink-0">{item.actorAvatar}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{item.actor}</span> {item.content}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>{item.timestamp}</span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {item.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {item.comments}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ActiveProjectsCardProps {
  projects: DemoProject[];
}

function ActiveProjectsCard({ projects }: ActiveProjectsCardProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 md:p-6 border-b">
        <h3 className="font-semibold">Active Projects</h3>
        <p className="text-sm text-gray-600">Projects you're supporting</p>
      </div>
      <div className="p-4 md:p-6 space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="pb-4 border-b last:border-b-0 last:pb-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-lg">{project.avatar}</span>
                <div>
                  <h4 className="font-medium text-sm">{project.title}</h4>
                  <p className="text-xs text-gray-600">by {project.creator}</p>
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded text-xs ${
                  project.status === 'funded'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {project.status}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>{formatSats(project.raised)} raised</span>
                <span>{project.backers} backers</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className="bg-orange-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${(project.raised / project.goal) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>{project.daysLeft} days left</span>
                <span>{project.category}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}













































