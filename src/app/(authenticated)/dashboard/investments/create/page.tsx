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
  const [initialData, setInitialData] = useState<Partial<InvestmentFormData> | undefined>(
    undefined
  );

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
            }
          }
        } catch (error) {
          logger.error('Failed to fetch investment:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchInvestment();
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

    if (title || description) {
      const prefillData: Partial<InvestmentFormData> = {};
      if (title) {
        prefillData.title = title;
      }
      if (description) {
        prefillData.description = description;
      }
      setInitialData(prefillData);
    }
  }, [searchParams, editId]);

  if (loading) {
    return <Loading fullScreen message="Loading investment..." />;
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
