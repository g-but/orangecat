/**
 * Loan Collateral Field Component
 *
 * Wrapper component that integrates CollateralSelector with EntityForm.
 * Manages collateral state and syncs with form data.
 *
 * Created: 2025-01-31
 * Last Modified: 2025-01-31
 * Last Modified Summary: Initial creation
 */

'use client';

import { useState, useEffect } from 'react';
import { CollateralSelector, type CollateralItem } from './CollateralSelector';

interface LoanCollateralFieldProps {
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
  disabled?: boolean;
}

export function LoanCollateralField({
  formData,
  onFieldChange,
  disabled = false,
}: LoanCollateralFieldProps) {
  const [collateral, setCollateral] = useState<CollateralItem[]>([]);

  // Initialize from form data if present (only on mount)
  useEffect(() => {
    if (formData.collateral && Array.isArray(formData.collateral)) {
      setCollateral(formData.collateral);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCollateralChange = (items: CollateralItem[]) => {
    setCollateral(items);
    // Store collateral in form data
    onFieldChange('collateral', items);
  };

  return (
    <CollateralSelector
      selectedCollateral={collateral}
      onCollateralChange={handleCollateralChange}
      loanAmount={formData.original_amount}
      loanCurrency={formData.currency || 'CHF'}
      disabled={disabled}
    />
  );
}
