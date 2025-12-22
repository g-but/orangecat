'use client';

import { Circle } from '@/types/circles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Users, Settings, Crown } from 'lucide-react';

interface CircleListProps {
  circles: Circle[];
  onCircleUpdated?: () => void;
}

export function CircleList({ circles, onCircleUpdated }: CircleListProps) {
  if (circles.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold">No circles yet</h3>
        <p className="text-muted-foreground">Create your first circle to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {circles.map(circle => (
        <Card key={circle.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-lg truncate">{circle.name}</CardTitle>
                  <Badge variant="secondary" className="gap-1">
                    <Crown className="h-3 w-3" />
                    Owner
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {circle.description || 'No description provided'}
                </CardDescription>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{circle.member_count}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{circle.total_balance_sats}</p>
                <p className="text-sm text-muted-foreground">Sats Balance</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{circle.total_projects}</p>
                <p className="text-sm text-muted-foreground">Projects</p>
              </div>
              <div className="text-center">
                <Badge variant={circle.is_public ? 'default' : 'secondary'}>
                  {circle.is_public ? 'Public' : 'Private'}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1">
                View Circle
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                Manage Members
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
