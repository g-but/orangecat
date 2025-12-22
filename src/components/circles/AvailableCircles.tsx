'use client';

import { useState } from 'react';
import { Circle } from '@/types/circles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Users, Globe, Crown, UserPlus } from 'lucide-react';
import circlesService from '@/services/circles';
import { toast } from 'sonner';

interface AvailableCirclesProps {
  circles: Circle[];
  onCircleJoined?: () => void;
}

export function AvailableCircles({ circles, onCircleJoined }: AvailableCirclesProps) {
  const [joiningCircleId, setJoiningCircleId] = useState<string | null>(null);

  const handleJoinCircle = async (circleId: string) => {
    try {
      setJoiningCircleId(circleId);
      const result = await circlesService.joinCircle(circleId);

      if (result.success) {
        toast.success('Successfully joined circle!');
        onCircleJoined?.();
      } else {
        toast.error(result.error || 'Failed to join circle');
      }
    } catch (error) {
      console.error('Failed to join circle:', error);
      toast.error('Failed to join circle');
    } finally {
      setJoiningCircleId(null);
    }
  };

  if (circles.length === 0) {
    return (
      <div className="text-center py-8">
        <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold">No circles available</h3>
        <p className="text-muted-foreground">Be the first to create a circle!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {circles.map(circle => (
        <Card key={circle.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">{circle.name}</CardTitle>
                <CardDescription className="text-xs">
                  {circle.category
                    ? circle.category.charAt(0).toUpperCase() + circle.category.slice(1)
                    : 'Community'}
                </CardDescription>
              </div>
              {circle.is_public && <Globe className="h-4 w-4 text-green-600 flex-shrink-0" />}
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {circle.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{circle.description}</p>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span>{circle.member_count} members</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {circle.join_policy === 'open' ? 'Open' : 'Invite Only'}
              </Badge>
            </div>

            <Button
              size="sm"
              className="w-full gap-1"
              onClick={() => handleJoinCircle(circle.id)}
              disabled={joiningCircleId === circle.id}
            >
              <UserPlus className="h-3 w-3" />
              {joiningCircleId === circle.id ? 'Joining...' : 'Join Circle'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
