'use client';

/**
 * CREATE LOAN PAGE
 *
 * Uses the unified EntityForm component for consistent UX.
 * No templates yet - can add LoanTemplates later if needed.
 *
 * Created: 2025-12-04
 * Last Modified: 2025-12-16
 * Last Modified Summary: Simplified to use standard unified pattern
 */

import { EntityForm } from '@/components/create';
import { loanConfig } from '@/config/entity-configs';

export default function CreateLoanPage() {
  return <EntityForm config={loanConfig} />;
}
