'use client';

/**
 * CREATE/EDIT PRODUCT PAGE (Services)
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Supports both create and edit modes via query parameter.
 *
 * Created: 2025-12-03
 * Last Modified: 2026-02-24
 * Last Modified Summary: Added edit mode support (?edit=id)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { EntityForm } from '@/components/create/EntityForm';
import { serviceConfig } from '@/config/entity-configs';
import { useCreatePrefill } from '@/hooks/useCreatePrefill';
import Loading from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { ROUTES } from '@/config/routes';
import type { UserServiceFormData } from '@/lib/validation';

export default function CreateServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { user, hydrated } = useAuth();
  const [serviceData, setServiceData] = useState<Partial<UserServiceFormData> | null>(null);
  const [loading, setLoading] = useState(!!editId);
  const [editError, setEditError] = useState<string | null>(null);

  const { initialData } = useCreatePrefill<UserServiceFormData>({
    entityType: 'service',
    enabled: !editId,
  });

  // Fetch service data if in edit mode
  useEffect(() => {
    if (editId && user?.id && hydrated) {
      const fetchService = async () => {
        try {
          const response = await fetch(`/api/services/${editId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              setServiceData(result.data);
            } else {
              setEditError('Failed to load service data');
            }
          } else {
            setEditError(
              response.status === 404 ? 'Service not found' : 'Failed to load service data'
            );
          }
        } catch (error) {
          logger.error('Failed to fetch service:', error);
          setEditError('Failed to load service data');
        } finally {
          setLoading(false);
        }
      };
      fetchService();
    } else if (!editId) {
      setLoading(false);
    }
  }, [editId, user?.id, hydrated]);

  if (loading) {
    return <Loading fullScreen message="Loading service..." />;
  }

  if (editId && editError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">{editError}</h3>
        <p className="text-gray-500 mb-4">Unable to load service for editing.</p>
        <button
          onClick={() => router.push(ROUTES.DASHBOARD.SERVICES)}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Back to services
        </button>
      </div>
    );
  }

  if (editId && serviceData) {
    return (
      <EntityForm
        config={serviceConfig}
        initialValues={serviceData}
        mode="edit"
        entityId={editId}
      />
    );
  }

  return (
    <EntityCreationWizard<UserServiceFormData>
      config={serviceConfig}
      initialData={initialData}
      onCancel={() => router.push(ROUTES.DASHBOARD.SERVICES)}
    />
  );
}
