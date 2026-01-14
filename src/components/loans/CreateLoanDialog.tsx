'use client';
import { logger } from '@/utils/logger';

import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/Button';
import { Loader2, DollarSign } from 'lucide-react';
import loansService from '@/services/loans';
import { CreateLoanRequest } from '@/types/loans';
import { toast } from 'sonner';
import { LoanTemplates, type LoanTemplateData } from './LoanTemplates';
import { CreateAssetDialog } from '../assets/CreateAssetDialog';
import { DEFAULT_CURRENCY } from '@/config/currencies';
import { loanSchema, type LoanFormData } from './validation';
import { DEFAULT_LOAN_FORM_VALUES } from './constants';
import { useLoanCategories } from './hooks/useLoanCategories';
import { useAssets } from './hooks/useAssets';
import { BasicInfoSection } from './sections/BasicInfoSection';
import { FinancialDetailsSection } from './sections/FinancialDetailsSection';
import { LenderInfoSection } from './sections/LenderInfoSection';
import { PreferencesSection } from './sections/PreferencesSection';
import { CollateralSection } from './sections/CollateralSection';
import type { CreateLoanDialogProps } from './types';

export function CreateLoanDialog({
  open,
  onOpenChange,
  onLoanCreated,
  onLoanUpdated,
  mode = 'create',
  loanId,
  initialValues,
}: CreateLoanDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [pledgedValue, setPledgedValue] = useState<string>('');
  const [pledgedCurrency, setPledgedCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [showCreateAsset, setShowCreateAsset] = useState(false);

  // Use custom hooks for data loading
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useLoanCategories(open);
  const { assets, loading: assetsLoading, error: assetsError, refreshAssets } = useAssets(open);

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema) as Resolver<LoanFormData>,
    defaultValues: DEFAULT_LOAN_FORM_VALUES,
  });

  // Preload initial values when editing
  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      form.reset({
        title: initialValues.title || '',
        description: initialValues.description || '',
        loan_category_id: initialValues.loan_category_id || '',
        original_amount: initialValues.original_amount || 0,
        remaining_balance: initialValues.remaining_balance || 0,
        interest_rate: initialValues.interest_rate,
        monthly_payment: initialValues.monthly_payment,
        currency: initialValues.currency || DEFAULT_CURRENCY,
        lender_name: initialValues.lender_name || '',
        loan_number: initialValues.loan_number || '',
        origination_date: initialValues.origination_date || '',
        maturity_date: initialValues.maturity_date || '',
        is_public: initialValues.is_public ?? true,
        is_negotiable: initialValues.is_negotiable ?? true,
        minimum_offer_amount: initialValues.minimum_offer_amount,
        preferred_terms: initialValues.preferred_terms || '',
        contact_method: initialValues.contact_method || 'platform',
      });
    }
  }, [initialValues, mode, form]);

  const handleAssetCreated = () => {
    refreshAssets();
    setShowCreateAsset(false);
  };

  const handleAssetChange = (assetId: string) => {
    setSelectedAssetId(assetId);
    const found = assets.find(a => a.id === assetId);
    if (found) {
      setPledgedCurrency(found.currency || DEFAULT_CURRENCY);
    }
  };

  const onSubmit = async (data: LoanFormData) => {
    try {
      setLoading(true);

      // Convert form data to API format
      const loanData: CreateLoanRequest = {
        ...data,
        loan_category_id: data.loan_category_id || undefined,
        interest_rate: data.interest_rate || undefined,
        monthly_payment: data.monthly_payment || undefined,
        lender_name: data.lender_name || undefined,
        loan_number: data.loan_number || undefined,
        origination_date: data.origination_date || undefined,
        maturity_date: data.maturity_date || undefined,
        minimum_offer_amount: data.minimum_offer_amount || undefined,
        preferred_terms: data.preferred_terms || undefined,
      };

      const result =
        mode === 'edit' && loanId
          ? await loansService.updateLoan(loanId, loanData)
          : await loansService.createLoan(loanData);

      if (result.success) {
        // Attach collateral if selected and we are creating
        if (mode === 'create' && result.loan && selectedAssetId) {
          try {
            const body = {
              loan_id: result.loan.id,
              asset_id: selectedAssetId,
              pledged_value: pledgedValue ? Number(pledgedValue) : undefined,
              currency: pledgedCurrency || data.currency,
            };
            const res = await fetch('/api/loan-collateral', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(body),
            });
            if (!res.ok) {
              // Do not fail the whole flow; just inform the user
              logger.warn('Collateral attach failed');
            }
          } catch (e) {
            logger.warn('Collateral attach error', e);
          }
        }
        toast.success(mode === 'edit' ? 'Loan updated' : 'Loan created successfully!');
        if (mode === 'edit') {
          onLoanUpdated?.();
        } else {
          onLoanCreated?.();
        }
        form.reset();
      } else {
        toast.error(result.error || `Failed to ${mode === 'edit' ? 'update' : 'create'} loan`);
      }
    } catch (error) {
      logger.error('Failed to save loan:', error);
      toast.error(`Failed to ${mode === 'edit' ? 'update' : 'create'} loan`);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateApply = (template: LoanTemplateData) => {
    form.reset({
      ...form.getValues(),
      ...template,
      // keep optional toggles consistent
      is_public: template.contact_method ? true : form.getValues().is_public,
      contact_method: template.contact_method || 'platform',
    });
    setSelectedAssetId('');
    setPledgedValue('');
    setPledgedCurrency(template.currency || DEFAULT_CURRENCY);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {mode === 'edit' ? 'Edit Loan' : 'Add Your Loan'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update your loan details for refinancing offers.'
              : 'List your loan to receive refinancing offers or payoff proposals from the community. All information is kept secure and only shared with serious offerers.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <BasicInfoSection
              control={form.control}
              categories={categories}
              categoriesLoading={categoriesLoading}
              categoriesError={categoriesError}
            />

            {/* Financial Details */}
            <FinancialDetailsSection control={form.control} />

            {/* Lender Information */}
            <LenderInfoSection control={form.control} />

            {/* Preferences */}
            <PreferencesSection control={form.control} />

            {/* Collateral (Optional) */}
            <CollateralSection
              assets={assets}
              assetsLoading={assetsLoading}
              assetsError={assetsError}
              selectedAssetId={selectedAssetId}
              onAssetChange={handleAssetChange}
              onCreateAsset={() => setShowCreateAsset(true)}
              pledgedValue={pledgedValue}
              onPledgedValueChange={setPledgedValue}
              pledgedCurrency={pledgedCurrency}
              onPledgedCurrencyChange={setPledgedCurrency}
            />

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {mode === 'edit' ? 'Save Changes' : 'Create Loan Listing'}
              </Button>
            </div>
          </form>
        </Form>

        {/* Loan Templates - moved below form for better mobile UX */}
        <div className="mt-8 pt-6 border-t">
          <LoanTemplates onApply={handleTemplateApply} />
        </div>
      </DialogContent>

      {/* Create Asset Dialog */}
      <CreateAssetDialog
        open={showCreateAsset}
        onOpenChange={setShowCreateAsset}
        onAssetCreated={handleAssetCreated}
      />
    </Dialog>
  );
}
