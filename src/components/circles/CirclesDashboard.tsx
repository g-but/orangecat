'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { CircleList } from './CircleList';
import { AvailableCircles } from './AvailableCircles';
import { CreateCircleDialog } from './CreateCircleDialog';
import { Plus, Users, Target, TrendingUp } from 'lucide-react';
import circlesService from '@/services/circles';
import { Circle } from '@/types/circles';
import { useToast } from 'sonner';

export function CirclesDashboard() {
  const [myCircles, setMyCircles] = useState<Circle[]>([]);
  const [availableCircles, setAvailableCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load user's circles
      const circlesResult = await circlesService.getUserCircles();
      if (circlesResult.success) {
        setMyCircles(circlesResult.circles || []);
      }

      // Load available circles for discovery
      const availableResult = await circlesService.getAvailableCircles();
      if (availableResult.success) {
        setAvailableCircles(availableResult.circles || []);
      }

    } catch (error) {
      console.error('Failed to load circles data:', error);
      useToast().error('Failed to load circles data');
    } finally {
      setLoading(false);
    }
  };

  const handleCircleCreated = () => {
    setCreateDialogOpen(false);
    loadDashboardData();
    useToast().success('Circle created successfully!');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Circle Management</h2>
          <p className="text-muted-foreground">
            Create circles, join communities, and collaborate with like-minded people.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Circle
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="my-circles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-circles" className="gap-2">
            <Users className="h-4 w-4" />
            My Circles ({myCircles.length})
          </TabsTrigger>
          <TabsTrigger value="discover" className="gap-2">
            <Target className="h-4 w-4" />
            Discover ({availableCircles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-circles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Circles</CardTitle>
              <CardDescription>
                Circles you're a member of with shared goals and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myCircles.length > 0 ? (
                <CircleList circles={myCircles} onCircleUpdated={loadDashboardData} />
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No circles yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first circle or join existing communities.
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Circle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discover" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Discover Circles</CardTitle>
              <CardDescription>
                Find and join public circles that match your interests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableCircles.length > 0 ? (
                <AvailableCircles circles={availableCircles} onCircleJoined={loadDashboardData} />
              ) : (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No circles available</h3>
                  <p className="text-muted-foreground">
                    Be the first to create a circle and invite others to join!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Circle Dialog */}
      <CreateCircleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCircleCreated={handleCircleCreated}
      />
    </div>
  );
}


























