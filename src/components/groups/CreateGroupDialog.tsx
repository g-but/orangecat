/**
 * Create Group Dialog Component
 *
 * Unified creation dialog for groups.
 * Smart form that adapts based on group label selection.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-12-29
 * Last Modified Summary: Updated to use new unified group types
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Loader2, Users, Info } from 'lucide-react';
import groupsService from '@/services/groups';
import type { CreateGroupInput, GroupLabel, GovernancePreset } from '@/types/group';
import { createGroupSchema } from '@/services/groups/validation';
import { GROUP_LABELS, getGroupLabelDefaults, getGroupLabelsArray } from '@/config/group-labels';
import { GOVERNANCE_PRESETS } from '@/config/governance-presets';
import { toast } from 'sonner';
import type { z } from 'zod';
import { cn } from '@/lib/utils';
import { GuidancePanel } from '@/components/create/GuidancePanel';
import {
  groupGuidanceContent,
  groupDefaultGuidance,
  type GroupFieldType,
} from '@/lib/entity-guidance/group-guidance';
import { logger } from '@/utils/logger';

type GroupFormData = z.infer<typeof createGroupSchema>;

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateGroupDialog({ open, onOpenChange, onSuccess }: CreateGroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState<GroupFieldType>(null);

  const form = useForm<GroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      label: 'circle',
      governance_preset: 'consensus',
      is_public: false,
      visibility: 'members_only',
    },
  });

  const watchedLabel = form.watch('label') as GroupLabel;
  const labelConfig = GROUP_LABELS[watchedLabel];

  // Update form when label changes - apply smart defaults
  const handleLabelChange = (label: GroupLabel) => {
    form.setValue('label', label);

    // Apply defaults from config
    const defaults = getGroupLabelDefaults(label);
    form.setValue('governance_preset', defaults.governance_preset);
    form.setValue('is_public', defaults.is_public);
    form.setValue('visibility', defaults.visibility);
  };

  const onSubmit = async (data: GroupFormData) => {
    try {
      setLoading(true);

      const groupData: CreateGroupInput = {
        name: data.name,
        description: data.description || undefined,
        label: data.label as GroupLabel,
        tags: data.tags,
        governance_preset: data.governance_preset as GovernancePreset,
        is_public: data.is_public,
        visibility: data.visibility,
        bitcoin_address: data.bitcoin_address || undefined,
        lightning_address: data.lightning_address || undefined,
        avatar_url: data.avatar_url || undefined,
        banner_url: data.banner_url || undefined,
        voting_threshold: data.voting_threshold || undefined,
      };

      const result = await groupsService.createGroup(groupData);

      if (result.success) {
        toast.success('Group created successfully!');
        onSuccess();
        form.reset();
      } else {
        toast.error(result.error || 'Failed to create group');
      }
    } catch (error) {
      logger.error('Failed to create group', error, 'CreateGroupDialog');
      toast.error('Failed to create group');
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

  const groupLabels = getGroupLabelsArray();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Group
          </DialogTitle>
          <DialogDescription>
            Create a group to collaborate with others. Choose a label that best describes your
            group.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Label Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Group Type</CardTitle>
                <CardDescription>
                  Labels influence defaults but don&apos;t restrict capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Label *</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {groupLabels.map((labelOption) => {
                            const Icon = labelOption.icon;
                            const isSelected = field.value === labelOption.key;

                            return (
                              <button
                                key={labelOption.key}
                                type="button"
                                onClick={() => {
                                  field.onChange(labelOption.key);
                                  handleLabelChange(labelOption.key);
                                  setActiveField('label');
                                }}
                                className={cn(
                                  'p-3 rounded-lg border-2 text-left transition-all',
                                  isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                )}
                              >
                                <Icon
                                  className={cn('h-5 w-5 mb-1', `text-${labelOption.color}-500`)}
                                />
                                <div className="font-medium text-sm">{labelOption.name}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2">
                                  {labelOption.description}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Info Banner */}
                {labelConfig && (
                  <div className="flex gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>{labelConfig.name}:</strong> {labelConfig.description}
                      {labelConfig.suggestedFeatures.length > 0 && (
                        <span className="block mt-1 text-xs">
                          Suggested features: {labelConfig.suggestedFeatures.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>Set up your group&apos;s foundation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Bitcoin Investment Club" 
                          {...field}
                          onFocus={() => setActiveField('name')}
                        />
                      </FormControl>
                      <FormDescription>Choose a descriptive name for your group</FormDescription>
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
                          placeholder="Describe your group's purpose and goals..."
                          rows={4}
                          {...field}
                          onFocus={() => setActiveField('description')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
                <CardDescription>Configure how your group operates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="governance_preset"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Governance Model</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                          onOpenChange={(open) => open && setActiveField('governance_preset')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(GOVERNANCE_PRESETS).map(([key, preset]) => (
                              <SelectItem key={key} value={key}>
                                <div>
                                  <div className="font-medium">{preset.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {preset.description}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>How decisions are made in your group</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                          onOpenChange={(open) => open && setActiveField('visibility')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public - Anyone can see</SelectItem>
                            <SelectItem value="members_only">
                              Members Only - Only members can see content
                            </SelectItem>
                            <SelectItem value="private">
                              Private - Hidden from discovery
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>Who can discover and view your group</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Listed in Directory</FormLabel>
                        <FormDescription>
                          Show this group in public group listings
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          onFocus={() => setActiveField('is_public')}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bitcoin_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bitcoin Address (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="bc1..." 
                          {...field} 
                          value={field.value ?? ''}
                          onFocus={() => setActiveField('bitcoin_address')}
                        />
                      </FormControl>
                      <FormDescription>
                        Group treasury address for receiving Bitcoin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lightning_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lightning Address (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="group@lightning.address"
                          {...field}
                          value={field.value ?? ''}
                          onFocus={() => setActiveField('lightning_address')}
                        />
                      </FormControl>
                      <FormDescription>Lightning Network address for instant payments</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Group'
                )}
              </Button>
            </div>
          </form>
        </Form>
          </div>

          {/* Guidance Panel */}
          <div className="lg:col-span-1">
            <GuidancePanel
              activeField={activeField}
              guidanceContent={groupGuidanceContent}
              defaultGuidance={groupDefaultGuidance}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

