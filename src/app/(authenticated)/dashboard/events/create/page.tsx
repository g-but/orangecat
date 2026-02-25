'use client';

/**
 * CREATE/EDIT EVENT PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Supports both create and edit modes via query parameter.
 *
 * Created: 2025-01-30
 * Last Modified: 2026-02-24
 * Last Modified Summary: Added edit mode support (?edit=id)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { EntityForm } from '@/components/create/EntityForm';
import { eventConfig } from '@/config/entity-configs';
import Loading from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import type { EventFormData } from '@/lib/validation';

export default function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { user, hydrated } = useAuth();
  const [eventData, setEventData] = useState<Partial<EventFormData> | null>(null);
  const [loading, setLoading] = useState(!!editId);
  const [editError, setEditError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<EventFormData> | undefined>(undefined);

  // Fetch event data if in edit mode
  useEffect(() => {
    if (editId && user?.id && hydrated) {
      const fetchEvent = async () => {
        try {
          const response = await fetch(`/api/events/${editId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              setEventData(result.data);
            } else {
              setEditError('Failed to load event data');
            }
          } else {
            setEditError(response.status === 404 ? 'Event not found' : 'Failed to load event data');
          }
        } catch (error) {
          logger.error('Failed to fetch event:', error);
          setEditError('Failed to load event data');
        } finally {
          setLoading(false);
        }
      };
      fetchEvent();
    } else if (!editId) {
      setLoading(false);
    }
  }, [editId, user?.id, hydrated]);

  // Prefill support from URL params (create mode only)
  useEffect(() => {
    if (editId) {
      return;
    }

    const title = searchParams?.get('title');
    const description = searchParams?.get('description');
    const category = searchParams?.get('category');

    if (title || description) {
      const prefillData: Partial<EventFormData> = {};
      if (title) {
        prefillData.title = title;
      }
      if (description) {
        prefillData.description = description;
      }
      if (category) {
        prefillData.category = category;
      }
      setInitialData(prefillData);
    }
  }, [searchParams, editId]);

  if (loading) {
    return <Loading fullScreen message="Loading event..." />;
  }

  if (editId && editError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">{editError}</h3>
        <p className="text-gray-500 mb-4">Unable to load event for editing.</p>
        <button
          onClick={() => router.push('/dashboard/events')}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Back to events
        </button>
      </div>
    );
  }

  if (editId && eventData) {
    return (
      <EntityForm config={eventConfig} initialValues={eventData} mode="edit" entityId={editId} />
    );
  }

  return (
    <EntityCreationWizard<EventFormData>
      config={eventConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/events')}
    />
  );
}
