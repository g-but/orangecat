'use client';

/**
 * CREATE/EDIT LOAN PAGE
 *
 * Uses the unified CreateEntityWorkflow component for maximum modularity and DRY principles.
 * Leverages existing modular architecture: EntityForm + TemplateSelection + Workflow management.
 * Supports both create and edit modes via query parameter.
 *
 * Created: 2025-12-04
 * Last Modified: 2025-01-31
 * Last Modified Summary: Added edit mode support with query parameter handling
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreateEntityWorkflow } from '@/components/create';
import { EntityForm } from '@/components/create/EntityForm';
import { loanConfig } from '@/config/entity-configs';
import { LoanTemplates } from '@/components/create/templates';
import Loading from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import type { LoanFormData } from '@/lib/validation';

export default function CreateLoanPage() {
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { user, hydrated } = useAuth();
  const [loanData, setLoanData] = useState<Partial<LoanFormData> | null>(null);
  const [loading, setLoading] = useState(!!editId);

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
          console.error('Failed to fetch loan:', error);
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

  // Edit mode: use EntityForm directly (skip template selection)
  if (editId && loanData) {
    return (
      <EntityForm
        config={loanConfig}
        initialValues={loanData}
        mode="edit"
        entityId={editId}
      />
    );
  }

  // Create mode: use CreateEntityWorkflow
  return (
    <CreateEntityWorkflow
      config={loanConfig}
      TemplateComponent={LoanTemplates}
      pageHeader={{
        title: editId ? 'Edit Loan Listing' : 'Create Loan Listing',
        description: 'List your loan needs and connect with peer-to-peer lenders.'
      }}
      showTemplatesByDefault={false}
      initialValues={loanData || undefined}
    />
  );
}
