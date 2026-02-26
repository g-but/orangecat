/**
 * ShippingAddressForm — Address form for physical product purchases
 */

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ShippingAddressFormProps {
  onSubmit: (address: ShippingFormData) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export interface ShippingFormData {
  full_name: string;
  street: string;
  street2: string;
  city: string;
  state: string;
  postal_code: string;
  country_code: string;
  label: string;
  is_default: boolean;
}

export function ShippingAddressForm({ onSubmit, onCancel, loading }: ShippingAddressFormProps) {
  const [form, setForm] = useState<ShippingFormData>({
    full_name: '',
    street: '',
    street2: '',
    city: '',
    state: '',
    postal_code: '',
    country_code: 'CH',
    label: '',
    is_default: false,
  });

  const handleChange = (field: keyof ShippingFormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const isValid = form.full_name && form.street && form.city && form.postal_code;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700">Full Name</label>
        <Input
          value={form.full_name}
          onChange={e => handleChange('full_name', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Street</label>
        <Input
          value={form.street}
          onChange={e => handleChange('street', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Street 2 (optional)</label>
        <Input value={form.street2} onChange={e => handleChange('street2', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">City</label>
          <Input value={form.city} onChange={e => handleChange('city', e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Postal Code</label>
          <Input
            value={form.postal_code}
            onChange={e => handleChange('postal_code', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">State/Canton</label>
          <Input value={form.state} onChange={e => handleChange('state', e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Country</label>
          <Input
            value={form.country_code}
            onChange={e => handleChange('country_code', e.target.value)}
            placeholder="CH"
            maxLength={2}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="min-h-11">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!isValid || loading} className="min-h-11">
          {loading ? 'Saving...' : 'Save Address'}
        </Button>
      </div>
    </form>
  );
}
