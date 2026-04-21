'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Input from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, TrendingUp, Users, DollarSign, Target } from 'lucide-react';
import EntityListShell from '@/components/entity/EntityListShell';
import Loading from '@/components/Loading';
import { ResearchEntity } from '@/types/research';
import { logger } from '@/utils/logger';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { ROUTES } from '@/config/routes';
import { PROJECT_STATUS } from '@/config/project-statuses';

const FIELD_COLORS: Record<string, string> = {
  computer_science: 'bg-blue-100 text-blue-800',
  biology: 'bg-green-100 text-green-800',
  physics: 'bg-purple-100 text-purple-800',
  mathematics: 'bg-orange-100 text-orange-800',
  medicine: 'bg-red-100 text-red-800',
  engineering: 'bg-indigo-100 text-indigo-800',
  ai: 'bg-pink-100 text-pink-800',
};

const STATUS_COLORS: Record<string, string> = {
  [PROJECT_STATUS.ACTIVE]: 'bg-green-500',
  [PROJECT_STATUS.DRAFT]: 'bg-yellow-500',
  [PROJECT_STATUS.COMPLETED]: 'bg-blue-500',
  paused: 'bg-orange-500',
  [PROJECT_STATUS.CANCELLED]: 'bg-red-500',
};

export default function ResearchDashboard() {
  const router = useRouter();
  const { isLoading: authLoading, hydrated } = useRequireAuth();
  const { formatAmount } = useDisplayCurrency();
  const [entities, setEntities] = useState<ResearchEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldFilter, setFieldFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && hydrated) { fetchResearchEntities(); }
  }, [authLoading, hydrated]);

  const fetchResearchEntities = async () => {
    try {
      const response = await fetch('/api/research');
      if (response.ok) {
        const data = await response.json();
        setEntities(data.data || []);
      }
    } catch (error) {
      logger.error('Failed to fetch research entities', error, 'Research');
    } finally {
      setLoading(false);
    }
  };

  const filteredEntities = entities.filter(entity => {
    const matchesSearch =
      entity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesField = fieldFilter === 'all' || entity.field === fieldFilter;
    const matchesStatus = statusFilter === 'all' || entity.status === statusFilter;
    return matchesSearch && matchesField && matchesStatus;
  });

  if (authLoading || !hydrated) { return <Loading message="Loading research..." />; }

  return (
    <EntityListShell
      title="DeSci Research"
      description="Independent research with decentralized funding"
      headerActions={
        <Button onClick={() => router.push(`${ROUTES.DASHBOARD.RESEARCH}/create`)}>
          <Plus className="w-4 h-4 mr-2" />
          Start Research
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : entities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Research</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '—' : entities.filter(e => e.status === PROJECT_STATUS.ACTIVE).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading
                ? '—'
                : formatAmount(entities.reduce((sum, e) => sum + (e.funding_raised_btc || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '—' : entities.reduce((sum, e) => sum + e.total_contributors, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search research projects..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={fieldFilter} onValueChange={setFieldFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Fields" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fields</SelectItem>
            <SelectItem value="computer_science">Computer Science</SelectItem>
            <SelectItem value="biology">Biology</SelectItem>
            <SelectItem value="physics">Physics</SelectItem>
            <SelectItem value="medicine">Medicine</SelectItem>
            <SelectItem value="engineering">Engineering</SelectItem>
            <SelectItem value="artificial_intelligence">AI</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Research Entities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-2 bg-gray-200 rounded w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEntities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔬</div>
          <h3 className="text-lg font-semibold mb-2">No research entities found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || fieldFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start your first research project'}
          </p>
          <Button onClick={() => router.push(`${ROUTES.DASHBOARD.RESEARCH}/create`)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Research Entity
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntities.map(entity => (
            <Card
              key={entity.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/dashboard/research/${entity.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{entity.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {entity.description}
                    </CardDescription>
                  </div>
                  <Badge className={STATUS_COLORS[entity.status || 'draft'] ?? 'bg-gray-500'}>
                    {entity.status || 'draft'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Badge className={FIELD_COLORS[entity.field] ?? 'bg-gray-100 text-gray-800'}>
                  {entity.field.replace('_', ' ')}
                </Badge>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Funding Progress</span>
                    <span>
                      {formatAmount(entity.funding_raised_btc || 0)} /{' '}
                      {formatAmount(entity.funding_goal || 0)}
                    </span>
                  </div>
                  <Progress
                    value={
                      entity.funding_goal
                        ? ((entity.funding_raised_btc || 0) / entity.funding_goal) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Research Progress</span>
                    <span>{entity.completion_percentage}%</span>
                  </div>
                  <Progress value={entity.completion_percentage} className="h-2" />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{entity.total_contributors} contributors</span>
                  <span>{entity.follower_count} followers</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </EntityListShell>
  );
}
