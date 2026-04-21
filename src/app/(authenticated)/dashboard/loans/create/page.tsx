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
import { useCreatePrefill } from '@/hooks/useCreatePrefill';
import Loading from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { ROUTES } from '@/config/routes';
import type { LoanFormData } from '@/lib/validation';

export default function CreateLoanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { user, hydrated } = useAuth();
  const [loanData, setLoanData] = useState<Partial<LoanFormData> | null>(null);
  const [loading, setLoading] = useState(!!editId);
  const [editError, setEditError] = useState<string | null>(null);

  const { initialData } = useCreatePrefill<LoanFormData>({
    entityType: 'loan',
    enabled: !editId,
  });

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
            } else {
              setEditError('Failed to load loan data');
            }
          } else {
            setEditError(response.status === 404 ? 'Loan not found' : 'Failed to load loan data');
          }
        } catch (error) {
          logger.error('Failed to fetch loan:', error);
          setEditError('Failed to load loan data');
        } finally {
          setLoading(false);
        }
      };
      fetchLoan();
    } else if (!editId) {
      setLoading(false);
    }
  }, [editId, user?.id, hydrated]);

  if (loading) {
    return <Loading fullScreen message="Loading loan..." />;
  }

  if (editId && editError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">{editError}</h3>
        <p className="text-gray-500 mb-4">Unable to load loan for editing.</p>
        <button
          onClick={() => router.push(ROUTES.DASHBOARD.LOANS)}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Back to loans
        </button>
      </div>
    );
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
      onCancel={() => router.push(ROUTES.DASHBOARD.LOANS)}
    />
  );
}
