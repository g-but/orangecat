/**
 * Collateral Section
 *
 * Form section for collateral selection.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created collateral section component
 */

'use client';

import { FormControl, FormDescription, FormLabel } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Shield } from 'lucide-react';
import type { AssetOption } from '../types';
import { currencySelectOptions } from '@/config/currencies';

interface CollateralSectionProps {
  assets: AssetOption[];
  assetsLoading: boolean;
  assetsError: string | null;
  selectedAssetId: string;
  onAssetChange: (assetId: string) => void;
  onCreateAsset: () => void;
  pledgedValue: string;
  onPledgedValueChange: (value: string) => void;
  pledgedCurrency: string;
  onPledgedCurrencyChange: (currency: string) => void;
}

export function CollateralSection({
  assets,
  assetsLoading,
  assetsError,
  selectedAssetId,
  onAssetChange,
  onCreateAsset,
  pledgedValue,
  onPledgedValueChange,
  pledgedCurrency,
  onPledgedCurrencyChange,
}: CollateralSectionProps) {
  return (
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
          <Select
            onValueChange={v => {
              if (v === '__create_asset__') {
                onCreateAsset();
                return;
              }
              onAssetChange(v);
            }}
            value={selectedAssetId}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue
                  placeholder={assetsLoading ? 'Loading assets...' : 'No asset selected'}
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {assetsLoading && (
                <div className="px-3 py-2 text-sm text-muted-foreground">Loading assets...</div>
              )}
              {!assetsLoading && assets.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No assets found. Create one under Assets.
                </div>
              )}
              {!assetsLoading &&
                assets.map(a => (
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
            <Input
              type="number"
              step="0.01"
              value={pledgedValue}
              onChange={e => onPledgedValueChange(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <FormLabel>Currency</FormLabel>
            <Select onValueChange={onPledgedCurrencyChange} value={pledgedCurrency}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {currencySelectOptions.map(option => (
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
  );
}
