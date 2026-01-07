/**
 * Collateral Selector Component
 *
 * Unified collateral selection supporting both assets and wallets.
 * Calculates total collateral value and displays it prominently.
 *
 * Created: 2025-01-31
 * Last Modified: 2025-01-31
 * Last Modified Summary: Initial creation of unified collateral selector
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Shield, Wallet, Package, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DEFAULT_CURRENCY } from '@/config/currencies';
import { useAuth } from '@/hooks/useAuth';

export interface CollateralItem {
  id: string;
  type: 'asset' | 'wallet';
  name: string;
  value: number;
  currency: string;
  metadata?: {
    verification_status?: string;
    balance_btc?: number;
  };
}

interface CollateralSelectorProps {
  /** Selected collateral items */
  selectedCollateral: CollateralItem[];
  /** Callback when collateral changes */
  onCollateralChange: (items: CollateralItem[]) => void;
  /** Loan amount for comparison */
  loanAmount?: number;
  /** Loan currency */
  loanCurrency?: string;
  /** Whether component is disabled */
  disabled?: boolean;
}

export function CollateralSelector({
  selectedCollateral,
  onCollateralChange,
  loanAmount,
  loanCurrency = DEFAULT_CURRENCY,
  disabled = false,
}: CollateralSelectorProps) {
  const { profile } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  // Fetch assets and wallets
  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [assetsRes, walletsRes] = await Promise.all([
          fetch('/api/assets', { credentials: 'include' }),
          fetch(`/api/wallets?profile_id=${profile.id}`, { credentials: 'include' }),
        ]);

        if (assetsRes.ok) {
          const assetsData = await assetsRes.json();
          setAssets(assetsData.data || []);
        }

        if (walletsRes.ok) {
          const walletsData = await walletsRes.json();
          setWallets(walletsData.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch collateral options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.id]);

  // Calculate total collateral value
  const totalCollateral = useMemo(() => {
    return selectedCollateral.reduce((sum, item) => {
      // Convert to loan currency (simplified - would need real conversion)
      return sum + item.value;
    }, 0);
  }, [selectedCollateral]);

  // Calculate coverage percentage
  const coveragePercentage = useMemo(() => {
    if (!loanAmount || loanAmount === 0) {return null;}
    return Math.min(100, (totalCollateral / loanAmount) * 100);
  }, [totalCollateral, loanAmount]);

  const handleAddAsset = (asset: any) => {
    const newItem: CollateralItem = {
      id: asset.id,
      type: 'asset',
      name: asset.title,
      value: asset.estimated_value || 0,
      currency: asset.currency || DEFAULT_CURRENCY,
      metadata: {
        verification_status: asset.verification_status,
      },
    };
    onCollateralChange([...selectedCollateral, newItem]);
    setShowAssetSelector(false);
  };

  const handleAddWallet = (wallet: any) => {
    // Convert BTC balance to fiat (simplified - would need real conversion)
    const btcValue = wallet.balance_btc || 0;
    const estimatedValue = btcValue * 86000; // Rough BTC price estimate

    const newItem: CollateralItem = {
      id: wallet.id,
      type: 'wallet',
      name: wallet.label,
      value: estimatedValue,
      currency: DEFAULT_CURRENCY,
      metadata: {
        balance_btc: btcValue,
      },
    };
    onCollateralChange([...selectedCollateral, newItem]);
    setShowWalletSelector(false);
  };

  const handleRemoveCollateral = (id: string) => {
    onCollateralChange(selectedCollateral.filter(item => item.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Collateral (Optional)
        </CardTitle>
        <CardDescription>
          Add assets or wallets as collateral to potentially improve loan terms. Higher collateral value may result in better interest rates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Collateral Summary */}
        {selectedCollateral.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Total Collateral Value</span>
              <span className="text-lg font-bold text-gray-900">
                {totalCollateral.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {loanCurrency}
              </span>
            </div>
            {loanAmount && (
              <div className="flex items-center gap-2 mt-2">
                {coveragePercentage !== null && (
                  <>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all',
                          coveragePercentage >= 100
                            ? 'bg-green-500'
                            : coveragePercentage >= 50
                            ? 'bg-yellow-500'
                            : 'bg-orange-500'
                        )}
                        style={{ width: `${Math.min(100, coveragePercentage)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      {coveragePercentage.toFixed(0)}% coverage
                    </span>
                  </>
                )}
              </div>
            )}
            {loanAmount && coveragePercentage !== null && (
              <div className="mt-2 flex items-center gap-1 text-xs">
                {coveragePercentage >= 100 ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span className="text-green-700">Collateral fully covers loan amount</span>
                  </>
                ) : coveragePercentage >= 50 ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-yellow-600" />
                    <span className="text-yellow-700">Partial collateral coverage</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-orange-600" />
                    <span className="text-orange-700">Low collateral coverage</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Selected Collateral Items */}
        {selectedCollateral.length > 0 && (
          <div className="space-y-2">
            {selectedCollateral.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center',
                    item.type === 'asset' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  )}>
                    {item.type === 'asset' ? (
                      <Package className="w-4 h-4" />
                    ) : (
                      <Wallet className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.type === 'asset' ? 'Asset' : 'Wallet'}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {item.currency}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCollateral(item.id)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add Collateral Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowAssetSelector(!showAssetSelector);
              setShowWalletSelector(false);
            }}
            disabled={disabled || loading}
            className="flex-1"
          >
            <Package className="w-4 h-4 mr-2" />
            Add Asset
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowWalletSelector(!showWalletSelector);
              setShowAssetSelector(false);
            }}
            disabled={disabled || loading}
            className="flex-1"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Add Wallet
          </Button>
        </div>

        {/* Asset Selector */}
        {showAssetSelector && (
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Select Asset</h4>
            {loading ? (
              <p className="text-sm text-gray-500">Loading assets...</p>
            ) : assets.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">No assets available</p>
                <a href="/dashboard/assets/create" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Create an asset
                </a>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {assets
                  .filter(asset => !selectedCollateral.some(c => c.id === asset.id && c.type === 'asset'))
                  .map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => handleAddAsset(asset)}
                      className="w-full text-left p-2 hover:bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{asset.title}</span>
                        {asset.estimated_value && (
                          <span className="text-xs text-gray-500">
                            {asset.estimated_value.toLocaleString()} {asset.currency || DEFAULT_CURRENCY}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Wallet Selector */}
        {showWalletSelector && (
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Select Wallet</h4>
            {loading ? (
              <p className="text-sm text-gray-500">Loading wallets...</p>
            ) : wallets.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">No wallets available</p>
                <a href="/dashboard/wallets/create" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Create a wallet
                </a>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {wallets
                  .filter(wallet => !selectedCollateral.some(c => c.id === wallet.id && c.type === 'wallet'))
                  .map((wallet) => (
                    <button
                      key={wallet.id}
                      type="button"
                      onClick={() => handleAddWallet(wallet)}
                      className="w-full text-left p-2 hover:bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{wallet.label}</span>
                        {wallet.balance_btc && (
                          <span className="text-xs text-gray-500">
                            {wallet.balance_btc.toFixed(8)} BTC
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
