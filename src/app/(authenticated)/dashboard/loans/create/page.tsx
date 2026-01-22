'use client';

/**
 * CREATE/EDIT LOAN PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Supports both create and edit modes via query parameter.
 *
 * Supports:
 * - Create mode: /dashboard/loans/create (shows template selection then form)
 * - Edit mode: /dashboard/loans/create?edit=<id> (shows form directly with existing data)
 * - Prefill from URL params: /dashboard/loans/create?title=...&description=...
 *
 * Created: 2025-12-04
 * Last Modified: 2026-01-22
 * Last Modified Summary: Migrated to EntityCreationWizard (DRY - single wizard for all entities)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { EntityForm } from '@/components/create/EntityForm';
import { loanConfig } from '@/config/entity-configs';
import Loading from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import type { LoanFormData } from '@/lib/validation';

export default function CreateLoanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { user, hydrated } = useAuth();
  const [loanData, setLoanData] = useState<Partial<LoanFormData> | null>(null);
  const [loading, setLoading] = useState(!!editId);
  const [initialData, setInitialData] = useState<Partial<LoanFormData> | undefined>(undefined);

  // Fetch loan data if in edit mode
  useEffect(() => {
    if (editId && user?.id && hydrated) {
      const fetchLoan = async () => {
        try {
          const response = await fetch(`/api/loans/${editId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              setLoanData(result.data);
            }
          }
        } catch (error) {
          logger.error('Failed to fetch loan:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchLoan();
    } else if (!editId) {
      setLoading(false);
    }
  }, [editId, user?.id, hydrated]);

  // Prefill support from URL params (create mode only)
  useEffect(() => {
    if (editId) {
      return;
    } // Don't prefill in edit mode

    const title = searchParams?.get('title');
    const description = searchParams?.get('description');
    const loanType = searchParams?.get('loan_type');

    if (title || description) {
      const prefillData: Partial<LoanFormData> = {};
      if (title) {
        prefillData.title = title;
      }
      if (description) {
        prefillData.description = description;
      }
      if (loanType) {
        prefillData.loan_type = loanType as LoanFormData['loan_type'];
      }
      setInitialData(prefillData);
    }
  }, [searchParams, editId]);

  if (loading) {
    return <Loading fullScreen message="Loading loan..." />;
  }

  // Edit mode: use EntityForm directly (skip template selection)
  if (editId && loanData) {
    return (
      <EntityForm config={loanConfig} initialValues={loanData} mode="edit" entityId={editId} />
    );
  }

  // Create mode: use EntityCreationWizard
  return (
    <EntityCreationWizard<LoanFormData>
      config={loanConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/loans')}
    />
  );
}
