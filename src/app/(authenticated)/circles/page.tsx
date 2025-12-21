'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PageLayout, PageHeader, PageSection } from '@/components/layout/PageLayout';
import {
  Users,
  Plus,
  Search,
  Filter,
  MapPin,
  Coins,
  Calendar,
  TrendingUp,
  Heart,
  Briefcase,
  Zap,
  Target,
  ArrowRight,
  Globe,
  Lock,
  Eye,
  Star,
  Activity
} from 'lucide-react';

export default function CirclesPage() {
  const router = useRouter();
  const { user, session } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock circle data - in real app, this would come from API
  const mockCircles = [
    {
      id: '1',
      name: 'Zurich Bitcoin Meetup',
      description: 'Monthly meetups for Bitcoin enthusiasts in Zurich',
      category: 'Community',
      visibility: 'public',
      memberCount: 47,
      maxMembers: null,
      hasWallet: true,
      activityLevel: 'regular',
      lastActivity: '2 hours ago',
      location: 'Zurich, Switzerland',
      icon: '₿',
      color: 'bg-orange-500'
    },
    {
      id: '2',
      name: 'Family Savings Circle',
      description: 'Our family emergency fund and shared expenses',
      category: 'Family',
      visibility: 'private',
      memberCount: 8,
      maxMembers: 10,
      hasWallet: true,
      activityLevel: 'casual',
      lastActivity: '1 day ago',
      location: null,
      icon: '👨‍👩‍👧‍👦',
      color: 'bg-blue-500'
    },
    {
      id: '3',
      name: 'Freelancer Network',
      description: 'Web developers sharing projects and opportunities',
      category: 'Professional',
      visibility: 'public',
      memberCount: 156,
      maxMembers: 200,
      hasWallet: false,
      activityLevel: 'regular',
      lastActivity: '30 min ago',
      location: null,
      icon: '💼',
      color: 'bg-green-500'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Circles', icon: Users, count: mockCircles.length },
    { id: 'Family', name: 'Family', icon: Heart, count: 1 },
    { id: 'Community', name: 'Community', icon: Users, count: 1 },
    { id: 'Professional', name: 'Professional', icon: Briefcase, count: 1 },
    { id: 'Investment', name: 'Investment', icon: Coins, count: 0 },
    { id: 'Other', name: 'Other', icon: Target, count: 0 },
  ];

  const filteredCircles = mockCircles.filter(circle => {
    const matchesSearch = circle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         circle.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || circle.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="w-4 h-4 text-green-500" />;
      case 'private': return <Lock className="w-4 h-4 text-yellow-500" />;
      case 'hidden': return <Eye className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'intensive': return 'bg-red-100 text-red-700';
      case 'regular': return 'bg-green-100 text-green-700';
      case 'casual': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <PageHeader
        title="Your Circles"
        description="Connect with communities, coordinate with family, and collaborate with colleagues through purpose-driven circles."
      />

      {/* Quick Actions */}
      <PageSection>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <Plus className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Create Circle</h3>
            <p className="text-gray-600 mb-4">Start a new circle for your community or purpose</p>
            <Button
              onClick={() => router.push('/circles/create')}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Create Circle
            </Button>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <Search className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Discover Circles</h3>
            <p className="text-gray-600 mb-4">Find public circles that match your interests</p>
            <Button
              onClick={() => router.push('/discover?type=circles')}
              variant="outline"
              className="w-full"
            >
              Browse Circles
            </Button>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Circle Analytics</h3>
            <p className="text-gray-600 mb-4">View insights about your circle participation</p>
            <Button
              variant="outline"
              className="w-full"
              disabled
            >
              Coming Soon
            </Button>
          </Card>
        </div>
      </PageSection>

      {/* Search and Filter */}
      <PageSection>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search circles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <category.icon className="w-4 h-4" />
                  {category.name}
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {category.count}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PageSection>

      {/* Circles Grid */}
      <PageSection>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCircles.map((circle) => (
            <Card key={circle.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${circle.color} rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                    {circle.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {circle.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getVisibilityIcon(circle.visibility)}
                      <span className="text-sm text-gray-500 capitalize">{circle.visibility}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {circle.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{circle.memberCount}{circle.maxMembers ? `/${circle.maxMembers}` : ''}</span>
                  </div>
                  {circle.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{circle.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(circle.activityLevel)}`}>
                  {circle.activityLevel} activity
                </div>
                {circle.hasWallet && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <Coins className="w-4 h-4" />
                    <span className="text-xs font-medium">Shared Wallet</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>Last active {circle.lastActivity}</span>
                <span className="capitalize">{circle.category}</span>
              </div>

              <Button
                onClick={() => router.push(`/circles/${circle.id}`)}
                variant="outline"
                size="sm"
                className="w-full group-hover:bg-purple-50 group-hover:border-purple-300"
              >
                View Circle
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          ))}
        </div>

        {filteredCircles.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No circles found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'You haven\'t joined any circles yet. Start by creating one or browsing public circles.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.push('/circles/create')}>
                Create Your First Circle
              </Button>
              <Button variant="outline" onClick={() => router.push('/discover?type=circles')}>
                Browse Public Circles
              </Button>
            </div>
          </div>
        )}
      </PageSection>

      {/* Circle Types Overview */}
      <PageSection background="gray">
        <h2 className="text-3xl font-bold text-center mb-12">Circle Types & Use Cases</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 text-center">
            <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Family Circles</h3>
            <p className="text-sm text-gray-600 mb-4">
              Coordinate family finances, plan events, and build stronger family bonds.
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Emergency funds</div>
              <div>• Family vacations</div>
              <div>• Shared expenses</div>
            </div>
          </Card>

          <Card className="p-6 text-center">
            <Coins className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Investment Circles</h3>
            <p className="text-sm text-gray-600 mb-4">
              Pool resources for Bitcoin investments and share research insights.
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Joint investments</div>
              <div>• Research sharing</div>
              <div>• Risk management</div>
            </div>
          </Card>

          <Card className="p-6 text-center">
            <Briefcase className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Professional Circles</h3>
            <p className="text-sm text-gray-600 mb-4">
              Network with peers, share opportunities, and collaborate on projects.
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Client referrals</div>
              <div>• Skill development</div>
              <div>• Project partnerships</div>
            </div>
          </Card>

          <Card className="p-6 text-center">
            <Users className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Community Circles</h3>
            <p className="text-sm text-gray-600 mb-4">
              Build local communities, organize events, and provide mutual support.
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Local events</div>
              <div>• Mutual aid</div>
              <div>• Community projects</div>
            </div>
          </Card>
        </div>
      </PageSection>
    </PageLayout>
  );
}