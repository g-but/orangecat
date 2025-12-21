'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2, Users, Globe, Lock } from 'lucide-react';
import circlesService from '@/services/circles';
import { CreateCircleRequest } from '@/types/circles';
import { toast } from 'sonner';

const circleSchema = z.object({
  name: z.string().min(3, 'Circle name must be at least 3 characters').max(100),
  description: z.string().optional(),
  category: z.enum(['family', 'friends', 'business', 'investment', 'community', 'project', 'other']).optional(),
  is_public: z.boolean().default(true),
  join_policy: z.enum(['open', 'invite_only', 'closed']).default('open'),
  visibility: z.enum(['public', 'members_only', 'private']).default('public'),
  rules: z.string().optional(),
});

type CircleFormData = z.infer<typeof circleSchema>;

interface CreateCircleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCircleCreated: () => void;
}

export function CreateCircleDialog({ open, onOpenChange, onCircleCreated }: CreateCircleDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CircleFormData>({
    resolver: zodResolver(circleSchema),
    defaultValues: {
      name: '',
      description: '',
      is_public: true,
      join_policy: 'open',
      visibility: 'public',
    },
  });

  const onSubmit = async (data: CircleFormData) => {
    try {
      setLoading(true);

      const circleData: CreateCircleRequest = {
        name: data.name,
        description: data.description,
        category: data.category,
        is_public: data.is_public,
        join_policy: data.join_policy,
        visibility: data.visibility,
        rules: data.rules,
      };

      const result = await circlesService.createCircle(circleData);

      if (result.success) {
        toast.success('Circle created successfully!');
        onCircleCreated();
        form.reset();
      } else {
        toast.error(result.error || 'Failed to create circle');
      }
    } catch (error) {
      console.error('Failed to create circle:', error);
      toast.error('Failed to create circle');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Circle
          </DialogTitle>
          <DialogDescription>
            Build a community around shared goals, interests, or projects.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>
                  Set up your circle's foundation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Circle Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Bitcoin Investment Club" {...field} />
                      </FormControl>
                      <FormDescription>
                        Choose a descriptive name for your circle
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What is this circle about? What goals do you share?"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Help others understand what your circle is about
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="family">Family</SelectItem>
                          <SelectItem value="friends">Friends</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                          <SelectItem value="community">Community</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Privacy & Access</CardTitle>
                <CardDescription>
                  Control who can find and join your circle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Public Circle</FormLabel>
                          <FormDescription>
                            Allow anyone to discover and view your circle
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="join_policy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Join Policy</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Open - Anyone can join
                            </div>
                          </SelectItem>
                          <SelectItem value="invite_only">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Invite Only - Members must be invited
                            </div>
                          </SelectItem>
                          <SelectItem value="closed">
                            <div className="flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              Closed - No new members
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How new members can join your circle
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Visibility</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public - Everyone can see content</SelectItem>
                          <SelectItem value="members_only">Members Only - Only members can see content</SelectItem>
                          <SelectItem value="private">Private - Only you can see content</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Who can see posts and activities in your circle
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community Rules</CardTitle>
                <CardDescription>
                  Optional guidelines for your circle members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="rules"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="What are the expectations for members? Any specific guidelines or code of conduct?"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Help members understand the community standards and expectations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Circle
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}












































