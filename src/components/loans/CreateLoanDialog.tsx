'use client';

import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, Percent, Calendar, Building, Shield } from 'lucide-react';
import loansService from '@/services/loans';
import { CreateLoanRequest, LoanCategory, Loan } from '@/types/loans';
import { toast } from 'sonner';
import { LoanTemplates, type LoanTemplateData } from './LoanTemplates';
import { CreateAssetDialog } from '../assets/CreateAssetDialog';
import { CURRENCY_CODES, currencySelectOptions, DEFAULT_CURRENCY } from '@/config/currencies';

const loanSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  loan_category_id: z.string().optional(),
  original_amount: z.number().min(0.01, 'Amount must be greater than 0'),
  remaining_balance: z.number().min(0.01, 'Balance must be greater than 0'),
  interest_rate: z.number().min(0).max(100).optional(),
  monthly_payment: z.number().min(0).optional(),
  currency: z.enum(CURRENCY_CODES).default(DEFAULT_CURRENCY),
  lender_name: z.string().optional(),
  loan_number: z.string().optional(),
  origination_date: z.string().optional(),
  maturity_date: z.string().optional(),
  is_public: z.boolean().default(true),
  is_negotiable: z.boolean().default(true),
  minimum_offer_amount: z.number().min(0).optional(),
  preferred_terms: z.string().optional(),
  contact_method: z.enum(['platform', 'email', 'phone']).default('platform'),
}).refine((data) => data.remaining_balance <= data.original_amount, {
  message: 'Remaining balance cannot exceed original amount',
  path: ['remaining_balance'],
});

type LoanFormData = z.infer<typeof loanSchema>;

interface CreateLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoanCreated?: () => void;
  onLoanUpdated?: () => void;
  mode?: 'create' | 'edit';
  loanId?: string;
  initialValues?: Partial<Loan>;
}

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
  const [categories, setCategories] = useState<LoanCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [assets, setAssets] = useState<Array<{ id: string; title: string; estimated_value: number | null; currency: string; verification_status: string }>>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [pledgedValue, setPledgedValue] = useState<string>('');
  const [pledgedCurrency, setPledgedCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [showCreateAsset, setShowCreateAsset] = useState(false);

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema) as Resolver<LoanFormData>,
    defaultValues: {
      title: '',
      description: '',
      original_amount: 0,
      remaining_balance: 0,
      currency: DEFAULT_CURRENCY,
      is_public: true,
      is_negotiable: true,
      contact_method: 'platform',
      minimum_offer_amount: undefined,
      interest_rate: undefined,
      monthly_payment: undefined,
      lender_name: '',
      loan_number: '',
      origination_date: '',
      maturity_date: '',
      preferred_terms: '',
      loan_category_id: '',
    },
  });

  // preload initial values when editing
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

  // Load categories when dialog opens
  useEffect(() => {
    let cancelled = false;
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError(null);
        const result = await loansService.getLoanCategories();
        if (!cancelled) {
          if (result.success) {
            setCategories(result.categories || []);
          } else {
            setCategoriesError(result.error || 'Failed to load categories');
          }
        }
      } catch (error) {
        if (!cancelled) {
          setCategoriesError('Failed to load categories');
        }
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    };

    if (open) {
      void loadCategories();
      // Load user's assets to optionally attach as collateral
      (async () => {
        try {
          setAssetsLoading(true);
          setAssetsError(null);
          const res = await fetch('/api/assets', { credentials: 'include' });
          if (!res.ok) {
            throw new Error('Failed to load assets');
          }
          const json = await res.json();
          if (!cancelled) {
            const items = (json.data || []).map((a: any) => ({
              id: a.id,
              title: a.title,
              estimated_value: a.estimated_value ?? null,
              currency: a.currency || 'USD',
              verification_status: a.verification_status || 'unverified',
            }));
            setAssets(items);
          }
        } catch (e: any) {
          if (!cancelled) setAssetsError(e?.message || 'Failed to load assets');
        } finally {
          if (!cancelled) setAssetsLoading(false);
        }
      })();
    }

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleAssetCreated = () => {
    // Refresh assets list
    (async () => {
      try {
        setAssetsLoading(true);
        setAssetsError(null);
        const res = await fetch('/api/assets', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          const items = (json.data || []).map((a: any) => ({
            id: a.id,
            title: a.title,
            estimated_value: a.estimated_value ?? null,
            currency: a.currency || 'USD',
            verification_status: a.verification_status || 'unverified',
          }));
          setAssets(items);
        }
      } catch (e: any) {
        setAssetsError(e?.message || 'Failed to refresh assets');
      } finally {
        setAssetsLoading(false);
      }
    })();
    setShowCreateAsset(false);
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

      const result = mode === 'edit' && loanId
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
              console.warn('Collateral attach failed');
            }
          } catch (e) {
            console.warn('Collateral attach error', e);
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
      console.error('Failed to save loan:', error);
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>
                  Tell us about your loan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., My Credit Card Debt" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for your loan listing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="loan_category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={categoriesLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select loan type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoriesLoading && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">Loading categories...</div>
                          )}
                          {!categoriesLoading && categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {categoriesError && (
                        <FormDescription className="text-red-600">{categoriesError}</FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional details about your loan..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional details to help potential offerers understand your situation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Details
                </CardTitle>
                <CardDescription>
                  Current loan information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="original_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Original Amount *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="5000.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="remaining_balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remaining Balance *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="3500.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="interest_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          Interest Rate (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="24.99"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthly_payment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Payment</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="125.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencySelectOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Lender Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Lender Information
                </CardTitle>
                <CardDescription>
                  Details about your current lender (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="lender_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lender Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Chase, Wells Fargo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="loan_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan/Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Last 4 digits only" {...field} />
                      </FormControl>
                      <FormDescription>
                        Only share last 4 digits for privacy and verification
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Listing Preferences</CardTitle>
                <CardDescription>
                  Control how your loan appears to potential offerers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Public Listing</FormLabel>
                    <FormDescription>
                      Allow anyone to see and offer on your loan
                    </FormDescription>
                  </div>
                  <FormField
                    control={form.control}
                    name="is_public"
                    render={({ field }) => (
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Negotiable Terms</FormLabel>
                    <FormDescription>
                      Allow offerers to propose different terms
                    </FormDescription>
                  </div>
                  <FormField
                    control={form.control}
                    name="is_negotiable"
                    render={({ field }) => (
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="minimum_offer_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Offer Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Only accept offers above this amount"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional: Set a minimum amount for serious offers only
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferred_terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Terms</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Prefer lower interest rate over longer term"
                          className="min-h-[60px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Let offerers know what terms you prefer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="platform">Through OrangeCat Platform</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How you prefer to be contacted about offers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Collateral (Optional) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Collateral (Optional)
                </CardTitle>
                <CardDescription>
                  Attach one of your listed assets as collateral to potentially improve offer terms.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <FormLabel>Select Asset</FormLabel>
                  <Select onValueChange={v => {
                    if (v === '__create_asset__') {
                      setShowCreateAsset(true);
                      return;
                    }
                    setSelectedAssetId(v);
                    const found = assets.find(a => a.id === v);
                    if (found) {
                      setPledgedCurrency(found.currency || DEFAULT_CURRENCY);
                    }
                  }} value={selectedAssetId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={assetsLoading ? 'Loading assets...' : 'No asset selected'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assetsLoading && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Loading assets...</div>
                      )}
                      {!assetsLoading && assets.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No assets found. Create one under Assets.</div>
                      )}
                      {!assetsLoading && assets.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.title} {a.estimated_value ? `(${a.estimated_value} ${a.currency})` : ''}
                        </SelectItem>
                      ))}
                      {/* Create Asset Option */}
                      <SelectItem value="__create_asset__" className="text-blue-600 font-medium">
                        ➕ Create New Asset
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {assetsError && <FormDescription className="text-red-600">{assetsError}</FormDescription>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormLabel>Pledged Value</FormLabel>
                    <Input type="number" step="0.01" value={pledgedValue} onChange={e => setPledgedValue(e.target.value)} placeholder="Optional" />
                  </div>
                  <div>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={setPledgedCurrency} value={pledgedCurrency}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencySelectOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

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
