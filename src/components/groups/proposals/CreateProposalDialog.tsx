/**
 * Create Proposal Dialog Component
 *
 * Dialog for creating new proposals in a group.
 * Enhanced with contextual guidance following the established pattern.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Added GuidancePanel and field focus detection for better UX
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { GuidancePanel } from '@/components/create/GuidancePanel';
import {
  proposalGuidanceContent,
  proposalDefaultGuidance,
  type ProposalFieldType,
} from '@/lib/entity-guidance/proposal-guidance';

const proposalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(5000, 'Description must be 5000 characters or less').optional(),
  proposal_type: z.enum(['general', 'treasury', 'membership', 'governance', 'employment']).default('general'),
  voting_threshold: z.number().int().min(1).max(100).optional(),
  voting_ends_at: z.string().optional(),
  is_public: z.boolean().optional().default(false),
  // Treasury proposal fields
  amount_sats: z.number().int().min(1).optional(),
  recipient_address: z.string().optional(),
  wallet_id: z.string().uuid().optional(),
  // Action type for proposals that execute actions
  action_type: z.string().optional(),
  action_data: z.record(z.any()).optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

interface CreateProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupSlug: string;
  onProposalCreated?: () => void;
}

export function CreateProposalDialog({
  open,
  onOpenChange,
  groupId,
  groupSlug,
  onProposalCreated,
}: CreateProposalDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [activeField, setActiveField] = useState<ProposalFieldType>(null);

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: '',
      description: '',
      proposal_type: 'general',
      is_public: false,
    },
  });

  const onSubmit = async (data: ProposalFormData) => {
    try {
      setSubmitting(true);

      // Build proposal payload
      const payload: Record<string, unknown> = {
        group_id: groupId,
        title: data.title,
        description: data.description,
        proposal_type: data.proposal_type,
        voting_threshold: data.voting_threshold,
        voting_ends_at: data.voting_ends_at,
        is_public: data.is_public,
      };

      // Add treasury-specific fields
      if (data.proposal_type === 'treasury') {
        payload.action_type = 'spend_funds';
        payload.action_data = {
          amount_sats: data.amount_sats,
          recipient_address: data.recipient_address,
          wallet_id: data.wallet_id,
          note: data.description,
        };
      }

      const response = await fetch(`/api/groups/${groupSlug}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create proposal');
      }

      toast.success('Proposal created successfully!');
      form.reset();
      setActiveField(null);
      onOpenChange(false);
      onProposalCreated?.();
    } catch (error) {
      logger.error('Failed to create proposal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create proposal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create New Proposal
          </DialogTitle>
          <DialogDescription>
            Create a new proposal for the group. It will start as a draft and can be activated for voting.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter proposal title"
                          {...field}
                          onFocus={() => setActiveField('title')}
                          onBlur={() => setActiveField(null)}
                        />
                      </FormControl>
                      <FormDescription>Brief, descriptive title for the proposal</FormDescription>
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
                          placeholder="Describe the proposal in detail..."
                          className="min-h-[120px]"
                          {...field}
                          onFocus={() => setActiveField('description')}
                          onBlur={() => setActiveField(null)}
                        />
                      </FormControl>
                      <FormDescription>Provide context and details about the proposal</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proposal_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setActiveField('proposal_type');
                        }}
                        defaultValue={field.value}
                        onOpenChange={(open) => {
                          if (open) setActiveField('proposal_type');
                        }}
                      >
                        <FormControl>
                          <SelectTrigger
                            onFocus={() => setActiveField('proposal_type')}
                            onBlur={() => setActiveField(null)}
                          >
                            <SelectValue placeholder="Select proposal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="treasury">Treasury (Spending)</SelectItem>
                          <SelectItem value="membership">Membership</SelectItem>
                          <SelectItem value="governance">Governance</SelectItem>
                          <SelectItem value="employment">Employment (Job Posting)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Category of the proposal</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Public Proposal</FormLabel>
                        <FormDescription>
                          Make this proposal visible to non-members (for job postings)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          onFocus={() => setActiveField('is_public')}
                          onBlur={() => setActiveField(null)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="voting_threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voting Threshold (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          placeholder="50"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          onFocus={() => setActiveField('voting_threshold')}
                          onBlur={() => setActiveField(null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum percentage of yes votes required to pass (defaults to group setting)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="voting_ends_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voting End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)
                          }
                          onFocus={() => setActiveField('voting_ends_at')}
                          onBlur={() => setActiveField(null)}
                        />
                      </FormControl>
                      <FormDescription>
                        When voting should end (defaults to 7 days after activation)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Treasury Proposal Fields */}
                {form.watch('proposal_type') === 'treasury' && (
                  <>
                    <FormField
                      control={form.control}
                      name="amount_sats"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (sats) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="1000000"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              onFocus={() => setActiveField('amount_sats')}
                              onBlur={() => setActiveField(null)}
                            />
                          </FormControl>
                          <FormDescription>
                            Amount to spend in satoshis
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recipient_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Bitcoin Address *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="bc1q..."
                              {...field}
                              onFocus={() => setActiveField('recipient_address')}
                              onBlur={() => setActiveField(null)}
                            />
                          </FormControl>
                          <FormDescription>
                            Bitcoin address to send funds to
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="wallet_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Wallet</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Wallet ID (optional)"
                              {...field}
                              onFocus={() => setActiveField('wallet_id')}
                              onBlur={() => setActiveField(null)}
                            />
                          </FormControl>
                          <FormDescription>
                            Specific wallet to spend from (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Proposal
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Guidance Panel */}
          <div className="lg:col-span-1">
            <GuidancePanel
              activeField={activeField}
              guidanceContent={proposalGuidanceContent}
              defaultGuidance={proposalDefaultGuidance}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
