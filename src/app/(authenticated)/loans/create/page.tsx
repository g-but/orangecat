'use client';

/**
 * CREATE LOAN PAGE
 *
 * Uses the unified EntityForm component for consistent UX.
 * Includes contextual guidance sidebar.
 *
 * Created: 2025-12-04
 * Last Modified: 2025-12-06
 * Last Modified Summary: Refactored to use modular EntityForm system
 */

import { EntityForm } from '@/components/create/EntityForm';
import { loanConfig } from '@/config/entity-configs';
import { LoanFormData } from '@/lib/validation';
import { supabase } from '@/services/supabase/core/client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function CreateLoanPage() {
  const { user, session } = useAuth();
  const router = useRouter();

  const handleSuccess = (data: LoanFormData & { id: string }) => {
    router.push('/loans');
  };

  const handleSubmit = async (data: LoanFormData) => {
    if (!user || !session) {
      throw new Error('You must be logged in to create a loan listing');
    }

    // Transform form data to match database schema
    const dbData = {
      title: data.title,
      description: data.description,
      loan_category_id: data.loan_category_id || null,
      original_amount: data.original_amount,
      remaining_balance: data.remaining_balance,
      interest_rate: data.interest_rate || null,
      bitcoin_address: data.bitcoin_address || null,
      lightning_address: data.lightning_address || null,
      fulfillment_type: data.fulfillment_type || 'manual',
      status: 'active',
      created_by: session.user.id,
    };

    const { data: loanData, error } = await supabase
      .from('loans')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to create loan listing');
    }

    return { ...loanData, ...data };
  };

  return (
    <EntityForm
      config={loanConfig}
      onSuccess={handleSuccess}
      onSubmit={handleSubmit}
    />
  );
}

