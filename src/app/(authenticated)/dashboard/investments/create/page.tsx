'use client';

/**
 * CREATE/EDIT INVESTMENT PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Supports both create and edit modes via query parameter.
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { EntityForm } from '@/components/create/EntityForm';
import { investmentConfig } from '@/config/entity-configs';
import { useCreatePrefill } from '@/hooks/useCreatePrefill';
import Loading from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { ROUTES } from '@/config/routes';
import type { InvestmentFormData } from '@/lib/validation';

export default function CreateInvestmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { user, hydrated } = useAuth();
  const [investmentData, setInvestmentData] = useState<Partial<InvestmentFormData> | null>(null);
  const [loading, setLoading] = useState(!!editId);
  const [editError, setEditError] = useState<string | null>(null);

  const { initialData } = useCreatePrefill<InvestmentFormData>({
    entityType: 'investment',
    enabled: !editId,
  });

  // Fetch investment data if in edit mode
  useEffect(() => {
    if (editId && user?.id && hydrated) {
      const fetchInvestment = async () => {
        try {
          const response = await fetch(`/api/investments/${editId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              setInvestmentData(result.data);
            } else {
              setEditError('Failed to load investment data');
            }
          } else {
            setEditError(
              response.status === 404 ? 'Investment not found' : 'Failed to load investment data'
            );
          }
        } catch (error) {
          logger.error('Failed to fetch investment:', error);
          setEditError('Failed to load investment data');
        } finally {
          setLoading(false);
        }
      };
      fetchInvestment();
    } else if (!editId) {
      setLoading(false);
    }
  }, [editId, user?.id, hydrated]);

  if (loading) {
    return <Loading fullScreen message="Loading investment..." />;
  }

  if (editId && editError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">{editError}</h3>
        <p className="text-gray-500 mb-4">Unable to load investment for editing.</p>
        <button
          onClick={() => router.push(ROUTES.DASHBOARD.INVESTMENTS)}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Back to investments
        </button>
      </div>
    );
  }

  // Edit mode
  if (editId && investmentData) {
    return (
      <EntityForm
        config={investmentConfig}
        initialValues={investmentData}
        mode="edit"
        entityId={editId}
      />
    );
  }

  // Create mode
  return (
    <EntityCreationWizard<InvestmentFormData>
      config={investmentConfig}
      initialData={initialData}
      onCancel={() => router.push(ROUTES.DASHBOARD.INVESTMENTS)}
    />
  );
}
