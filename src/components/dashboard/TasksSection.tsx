'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Star,
  Wallet,
  Share2,
  Target,
  Users,
  Globe,
  Edit3,
  Plus,
  Eye,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useProjectStore } from '@/stores/projectStore';

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'setup' | 'project' | 'growth' | 'optimization';
  action: {
    label: string;
    href: string;
    external?: boolean;
  };
  icon: React.ComponentType<{ className?: string }>;
}

interface TasksSectionProps {
  className?: string;
}

export default function TasksSection({ className }: TasksSectionProps) {
  const { user, profile } = useAuth();
  const { drafts } = useProjectStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const hasDrafts = drafts.length > 0;

  if (!user || !profile) {
    return null;
  }

  // Generate dynamic tasks based on user state
  const generateTasks = (): Task[] => {
    const tasks: Task[] = [];

    // Profile setup tasks
    if (!profile.username) {
      tasks.push({
        id: 'set-username',
        title: 'Set Your Username',
        description: 'Choose a unique username for your profile URL',
        completed: false,
        priority: 'high',
        category: 'setup',
        action: { label: 'Set Username', href: '/profile' },
        icon: Star,
      });
    }

    if (!profile.bio) {
      tasks.push({
        id: 'add-bio',
        title: 'Add Your Bio',
        description: 'Tell people about yourself and your mission',
        completed: false,
        priority: 'medium',
        category: 'setup',
        action: { label: 'Add Bio', href: '/profile' },
        icon: Edit3,
      });
    }

    if (!profile.bitcoin_address) {
      tasks.push({
        id: 'add-bitcoin-address',
        title: 'Add Bitcoin Address',
        description: 'Connect your Bitcoin wallet to receive donations',
        completed: false,
        priority: 'high',
        category: 'setup',
        action: { label: 'Add Address', href: '/profile' },
        icon: Wallet,
      });
    }

    // Campaign tasks
    if (hasDrafts) {
      tasks.push({
        id: 'complete-draft',
        title: 'Complete Your Campaign',
        description: `You have ${drafts.length} draft project${drafts.length > 1 ? 's' : ''} waiting to be published`,
        completed: false,
        priority: 'high',
        category: 'project',
        action: { label: 'Continue Campaign', href: '/projects/create' },
        icon: Target,
      });
    } else {
      tasks.push({
        id: 'create-first-project',
        title: 'Create Your First Campaign',
        description: 'Start fundraising with Bitcoin in just a few minutes',
        completed: false,
        priority: 'medium',
        category: 'project',
        action: { label: 'Create Campaign', href: '/projects/create' },
        icon: Plus,
      });
    }

    // Growth tasks
    tasks.push({
      id: 'explore-projects',
      title: 'Explore Other Projects',
      description: 'Discover and support projects and initiatives in your community',
      completed: completedTasks.has('explore-projects'),
      priority: 'low',
      category: 'growth',
      action: { label: 'Explore', href: '/discover' },
      icon: Globe,
    });

    if (profile.bitcoin_address) {
      tasks.push({
        id: 'share-profile',
        title: 'Share Your Profile',
        description: 'Let others know about your Bitcoin fundraising profile',
        completed: completedTasks.has('share-profile'),
        priority: 'medium',
        category: 'growth',
        action: { label: 'View Profile', href: `/profile/${profile.username || 'me'}` },
        icon: Share2,
      });
    }

    return tasks;
  };

  const tasks = generateTasks();
  const incompleteTasks = tasks.filter(task => !task.completed);
  const completionRate =
    tasks.length > 0
      ? Math.round(((tasks.length - incompleteTasks.length) / tasks.length) * 100)
      : 0;

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getCategoryIcon = (category: Task['category']) => {
    switch (category) {
      case 'setup':
        return Star;
      case 'project':
        return Target;
      case 'growth':
        return TrendingUp;
      case 'optimization':
        return Eye;
    }
  };

  if (incompleteTasks.length === 0) {
    return (
      <Card
        className={`border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 ${className}`}
      >
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Set! 🎉</h3>
          <p className="text-gray-600 mb-4">
            You&apos;ve completed all the recommended setup tasks. Your profile is ready for Bitcoin
            fundraising!
          </p>
          <Link href="/projects/create">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Your Next Campaign
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Recommended Tasks
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Complete these tasks to optimize your fundraising experience
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{completionRate}% Complete</div>
              <div className="text-xs text-gray-500">{incompleteTasks.length} remaining</div>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {incompleteTasks.slice(0, 4).map(task => {
              const IconComponent = task.icon;
              const CategoryIcon = getCategoryIcon(task.category);

              return (
                <div
                  key={task.id}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="mt-0.5 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <IconComponent className="w-4 h-4 text-gray-600" />
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <div
                            className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>

                        <Link href={task.action.href}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:bg-blue-50 hover:border-blue-300"
                          >
                            {task.action.label}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </div>

                      <CategoryIcon className="w-4 h-4 text-gray-400 mt-1" />
                    </div>
                  </div>
                </div>
              );
            })}

            {incompleteTasks.length > 4 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm">
                  Show {incompleteTasks.length - 4} more tasks
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
