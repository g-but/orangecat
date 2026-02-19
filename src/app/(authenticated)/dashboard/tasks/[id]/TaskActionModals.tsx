/**
 * Task Action Modals
 *
 * Modal UIs for task actions: Complete, Flag Attention, Request.
 * Form state is managed internally; actions are delegated via callbacks.
 *
 * Created: 2026-02-19
 */

'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import SimpleModal from '@/components/ui/SimpleModal';
import { Users } from 'lucide-react';

// ==================== Complete Modal ====================

interface CompleteModalProps {
  estimatedMinutes: number | null;
  actionLoading: boolean;
  onClose: () => void;
  onComplete: (notes: string, durationMinutes: number | '') => Promise<boolean>;
}

export function CompleteModal({
  estimatedMinutes,
  actionLoading,
  onClose,
  onComplete,
}: CompleteModalProps) {
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState<number | ''>('');

  const handleSubmit = async () => {
    const success = await onComplete(notes, duration);
    if (success) {
      setNotes('');
      setDuration('');
    }
  };

  return (
    <SimpleModal onClose={onClose} title="Complete Task">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value ? parseInt(e.target.value) : '')}
            placeholder={estimatedMinutes?.toString() || ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Notes about the completion..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={actionLoading}>
            Mark as Done
          </Button>
        </div>
      </div>
    </SimpleModal>
  );
}

// ==================== Attention Modal ====================

interface AttentionModalProps {
  actionLoading: boolean;
  onClose: () => void;
  onFlag: (message: string) => Promise<boolean>;
}

export function AttentionModal({ actionLoading, onClose, onFlag }: AttentionModalProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    const success = await onFlag(message);
    if (success) {
      setMessage('');
    }
  };

  return (
    <SimpleModal onClose={onClose} title="Flag Task">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Flag this task as &quot;needs attention&quot;. All team members will be notified.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="What is the problem?"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={actionLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Flag
          </Button>
        </div>
      </div>
    </SimpleModal>
  );
}

// ==================== Request Modal ====================

interface RequestModalProps {
  actionLoading: boolean;
  onClose: () => void;
  onRequest: (userId: string, message: string) => Promise<boolean>;
}

export function RequestModal({ actionLoading, onClose, onRequest }: RequestModalProps) {
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    const success = await onRequest(userId, message);
    if (success) {
      setUserId('');
      setMessage('');
    }
  };

  return (
    <SimpleModal onClose={onClose} title="Request Task">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To whom?</label>
          <select
            value={userId}
            onChange={e => setUserId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
          >
            <option value="">
              <Users className="h-4 w-4 inline mr-2" />
              All Team Members (Broadcast)
            </option>
            {/* TODO: Load team members here */}
          </select>
          <p className="text-xs text-gray-500 mt-1">Leave empty to notify all team members</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="Could you take care of this task?"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={actionLoading}>
            Send Request
          </Button>
        </div>
      </div>
    </SimpleModal>
  );
}
