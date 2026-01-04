/**
 * Support Modal Component
 *
 * Modal for selecting support type and submitting support.
 * Handles all support types: Bitcoin donation, signature, message, reaction.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created support modal component
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Coins,
  PenTool,
  MessageSquare,
  Heart,
  Loader2,
} from 'lucide-react';
import { ReactionPicker } from './ReactionPicker';
import type { SupportProjectRequest, ReactionEmoji } from '@/services/projects/support/types';
import { SUPPORT_TYPE_DESCRIPTIONS, REACTION_EMOJIS } from '@/services/projects/support/constants';
import projectSupportService from '@/services/projects/support';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export function SupportModal({ open, onOpenChange, projectId, onSuccess }: SupportModalProps) {
  const [activeTab, setActiveTab] = useState<string>('reaction');
  const [loading, setLoading] = useState(false);

  // Bitcoin donation fields
  const [amountSats, setAmountSats] = useState('');
  const [transactionHash, setTransactionHash] = useState('');

  // Signature/Message fields
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Reaction field
  const [selectedReaction, setSelectedReaction] = useState<ReactionEmoji | null>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      let request: SupportProjectRequest;

      switch (activeTab) {
        case 'bitcoin':
          if (!amountSats || parseFloat(amountSats) <= 0) {
            toast.error('Please enter a valid amount');
            return;
          }
          request = {
            support_type: 'bitcoin_donation',
            amount_sats: parseInt(amountSats),
            transaction_hash: transactionHash || undefined,
          };
          break;

        case 'signature':
          if (!displayName.trim()) {
            toast.error('Please enter your name');
            return;
          }
          request = {
            support_type: 'signature',
            display_name: displayName.trim(),
            message: message.trim() || undefined,
            is_anonymous: isAnonymous,
          };
          break;

        case 'message':
          if (!message.trim()) {
            toast.error('Please enter a message');
            return;
          }
          request = {
            support_type: 'message',
            display_name: displayName.trim() || undefined,
            message: message.trim(),
            is_anonymous: isAnonymous,
          };
          break;

        case 'reaction':
          if (!selectedReaction) {
            toast.error('Please select a reaction');
            return;
          }
          request = {
            support_type: 'reaction',
            reaction_emoji: selectedReaction,
          };
          break;

        default:
          toast.error('Please select a support type');
          return;
      }

      const result = await projectSupportService.createProjectSupport(projectId, request);

      if (result.success) {
        toast.success('Thank you for your support!');
        onSuccess?.();
        handleClose();
      } else {
        toast.error(result.error || 'Failed to submit support');
      }
    } catch (error) {
      logger.error('Failed to submit support', error, 'SupportModal');
      toast.error('Failed to submit support');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setActiveTab('reaction');
    setAmountSats('');
    setTransactionHash('');
    setDisplayName('');
    setMessage('');
    setIsAnonymous(false);
    setSelectedReaction(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Support This Project</DialogTitle>
          <DialogDescription>
            Show your support in multiple ways - donate Bitcoin, sign your name, leave a message, or react!
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reaction" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              React
            </TabsTrigger>
            <TabsTrigger value="signature" className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Sign
            </TabsTrigger>
            <TabsTrigger value="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Message
            </TabsTrigger>
            <TabsTrigger value="bitcoin" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Donate
            </TabsTrigger>
          </TabsList>

          {/* Reaction Tab */}
          <TabsContent value="reaction" className="space-y-4">
            <div>
              <Label className="mb-2 block">Choose a Reaction</Label>
              <p className="text-sm text-gray-500 mb-4">
                {SUPPORT_TYPE_DESCRIPTIONS.reaction}
              </p>
              <ReactionPicker
                onReactionSelect={setSelectedReaction}
                disabled={loading}
                className="justify-center"
              />
              {selectedReaction && (
                <div className="mt-4 text-center">
                  <div className="text-4xl mb-2">{selectedReaction}</div>
                  <p className="text-sm text-gray-600">Selected reaction</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Signature Tab */}
          <TabsContent value="signature" className="space-y-4">
            <div>
              <Label htmlFor="signature-name">Your Name *</Label>
              <Input
                id="signature-name"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will appear on the Wall of Support
              </p>
            </div>

            <div>
              <Label htmlFor="signature-message">Optional Message</Label>
              <Textarea
                id="signature-message"
                placeholder="Add a message of support (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Anonymous</Label>
                <p className="text-xs text-gray-500">Hide your identity</p>
              </div>
              <Switch
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
                disabled={loading}
              />
            </div>
          </TabsContent>

          {/* Message Tab */}
          <TabsContent value="message" className="space-y-4">
            <div>
              <Label htmlFor="message-text">Your Message *</Label>
              <Textarea
                id="message-text"
                placeholder="Leave a message of encouragement, congratulations, or support..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Share your thoughts and encouragement with the project creator
              </p>
            </div>

            <div>
              <Label htmlFor="message-name">Your Name (Optional)</Label>
              <Input
                id="message-name"
                placeholder="Your name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Anonymous</Label>
                <p className="text-xs text-gray-500">Hide your identity</p>
              </div>
              <Switch
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
                disabled={loading}
              />
            </div>
          </TabsContent>

          {/* Bitcoin Donation Tab */}
          <TabsContent value="bitcoin" className="space-y-4">
            <div>
              <Label htmlFor="amount-sats">Amount (sats) *</Label>
              <Input
                id="amount-sats"
                type="number"
                placeholder="100000"
                value={amountSats}
                onChange={(e) => setAmountSats(e.target.value)}
                disabled={loading}
                className="mt-1"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                {SUPPORT_TYPE_DESCRIPTIONS.bitcoin_donation}
              </p>
            </div>

            <div>
              <Label htmlFor="transaction-hash">Transaction Hash (Optional)</Label>
              <Input
                id="transaction-hash"
                placeholder="Transaction hash if already sent"
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                If you've already sent Bitcoin, paste the transaction hash here
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Support'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


