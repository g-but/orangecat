'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, Copy, Check, AlertCircle, RefreshCw, Info, ExternalLink } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { PageLayout, PageHeader, PageSection } from '@/components/layout/PageLayout'
import { QRCodeCanvas } from 'qrcode.react'
import { BITCOIN_CONFIG } from '@/config/bitcoin'
import { fetchBitcoinWalletData, formatBtcValue, getAddressUrl } from '@/services/bitcoin'
import { BitcoinWalletData } from '@/types/bitcoin'
import { TransactionsList } from '@/components/funding/TransactionsList'
import { formatDistanceToNow } from 'date-fns'
import { convertSatoshisToAll } from '@/utils/currency'

// Configuration for OrangeCat Funding Page
const ORANGECAT_FUNDING_PAGE_ID: string | null = null;

export default function OrangeCatDonationPage() {
  const router = useRouter();
  const { isLoading: authIsLoading } = useAuth();
  const [copied, setCopied] = useState(false);
  
  const [walletData, setWalletData] = useState<BitcoinWalletData | null>(null);
  const [isLoadingWalletData, setIsLoadingWalletData] = useState(true);
  const [walletFetchError, setWalletFetchError] = useState<string | null>(null);

  const donationAddress = BITCOIN_CONFIG.DONATION_ADDRESS;
  const qrCodeSize = BITCOIN_CONFIG.QR_CODE.SIZE || 256;
  const qrErrorCorrection = BITCOIN_CONFIG.QR_CODE.ERROR_CORRECTION || 'M';
  const blockExplorerAddressUrl = getAddressUrl(donationAddress);

  const loadWalletData = useCallback(async () => {
    setIsLoadingWalletData(true);
    setWalletFetchError(null);
    try {
      const data = await fetchBitcoinWalletData(donationAddress);
      setWalletData(data);
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
      setWalletFetchError("Could not load live wallet data. Please try refreshing.");
    }
    setIsLoadingWalletData(false);
  }, [donationAddress]);

  useEffect(() => {
    if (ORANGECAT_FUNDING_PAGE_ID) {
      router.replace(`/fund-us/${ORANGECAT_FUNDING_PAGE_ID}`);
      return;
    }
    loadWalletData();
  }, [router, loadWalletData]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(donationAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy address: ', err);
      alert('Failed to copy address.');
    });
  };
  
  // Main page loader
  if (authIsLoading || (ORANGECAT_FUNDING_PAGE_ID && !walletData)) {
    return (
      <PageLayout>
        <div className="flex flex-col justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-tiffany-500" />
          {ORANGECAT_FUNDING_PAGE_ID && 
            <p className='mt-4 text-gray-700'>Loading OrangeCat Profile...</p>
          }
        </div>
      </PageLayout>
    );
  }

  // Simplified Wallet Balance Display Component
  const WalletBalanceDisplay = ({ btcBalance, lastUpdatedTime, explorerUrl }: {
    btcBalance: number;
    lastUpdatedTime: number | undefined;
    explorerUrl: string;
  }) => {
    const balanceInSatoshis = Math.round(btcBalance * 100000000);
    const conversion = convertSatoshisToAll(balanceInSatoshis);

    return (
      <Card className="p-6 bg-tiffany-50/70 shadow-md mb-8 rounded-lg border border-tiffany-100">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-medium text-tiffany-700 mb-4">Current Confirmed Balance</p>
          <div className="flex items-center justify-center space-x-3 mb-2">
            <CurrencyDisplay 
              conversion={conversion}
              size="xl"
              layout="vertical"
              className="text-center"
            />
            <a 
              href={explorerUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              title="Verify balance on block explorer" 
              className="text-tiffany-500 hover:text-tiffany-700 transition-colors"
            >
              <ExternalLink size={20} />
            </a>
          </div>
          {lastUpdatedTime && 
            <p className="text-xs text-gray-500 mt-3">
              Wallet data last updated: {formatDistanceToNow(new Date(lastUpdatedTime), { addSuffix: true })}
            </p>
          }
        </div>
      </Card>
    );
  };

  return (
    <PageLayout maxWidth="4xl">
      <PageHeader
        title="Support OrangeCat"
        description="Your generosity fuels our mission. Help us make a difference!"
      />

      <PageSection>
        <Card className="bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="px-6 py-8 sm:p-10">
            <div className="bg-tiffany-50/70 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-tiffany-700 mb-2 text-center">
                Donate with Bitcoin
              </h2>
              <p className="text-sm text-tiffany-600 text-center mb-6">
                Scan the QR code with your Bitcoin wallet or copy the address below.
              </p>

              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="p-3 bg-white rounded-lg shadow-md inline-block border border-tiffany-200">
                  <QRCodeCanvas 
                    value={`bitcoin:${donationAddress}`}
                    size={qrCodeSize} 
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level={qrErrorCorrection as 'L' | 'M' | 'Q' | 'H'}
                    imageSettings={BITCOIN_CONFIG.QR_CODE.INCLUDE_LOGO && (BITCOIN_CONFIG.QR_CODE as any).LOGO_SRC ? {
                      src: (BITCOIN_CONFIG.QR_CODE as any).LOGO_SRC,
                      height: qrCodeSize * ((BITCOIN_CONFIG.QR_CODE as any).LOGO_HEIGHT_RATIO || 0.15),
                      width: qrCodeSize * ((BITCOIN_CONFIG.QR_CODE as any).LOGO_WIDTH_RATIO || 0.15),
                      excavate: (BITCOIN_CONFIG.QR_CODE as any).LOGO_EXCAVATE !== undefined ? (BITCOIN_CONFIG.QR_CODE as any).LOGO_EXCAVATE : true,
                    } : undefined}
                  />
                </div>

                <div className="w-full max-w-md">
                  <div className="relative">
                    <input
                      id="bitcoin-address"
                      type="text"
                      readOnly
                      value={donationAddress}
                      className="block w-full bg-gray-50 border-gray-300 rounded-md shadow-sm py-3 px-4 text-sm text-gray-700 focus:ring-tiffany-500 focus:border-tiffany-500 font-mono break-all"
                    />
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAddress}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-tiffany-600"
                      aria-label="Copy Bitcoin address"
                    >
                      {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              <p className="mt-6 text-xs text-gray-500 text-center">
                Please ensure you are sending to the correct address. Bitcoin transactions are irreversible.
              </p>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Every satoshi helps us continue our work. Thank you for your support!
              </p>
            </div>
          </div>
        </Card>
      </PageSection>

      <PageSection>
        <Card className="bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="px-6 py-8 sm:p-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-tiffany-600">Live Wallet Status</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadWalletData} 
                disabled={isLoadingWalletData} 
                className="border-tiffany-300 text-tiffany-700 hover:bg-tiffany-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingWalletData ? 'animate-spin' : ''} mr-2`} />
                Refresh
              </Button>
            </div>

            {isLoadingWalletData && (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-tiffany-500" />
                <p className="ml-3 text-gray-600">Loading live wallet data...</p>
              </div>
            )}

            {walletFetchError && !isLoadingWalletData && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{walletFetchError}</p>
                  </div>
                </div>
              </div>
            )}

            {!isLoadingWalletData && !walletFetchError && walletData && (
              <>
                <WalletBalanceDisplay 
                  btcBalance={walletData.balance}
                  lastUpdatedTime={walletData.lastUpdated}
                  explorerUrl={blockExplorerAddressUrl}
                />
                <div>
                  <h3 className="text-xl font-semibold text-tiffany-700 mb-4 pt-6 border-t border-tiffany-200">Recent Transactions</h3>
                  <TransactionsList transactions={walletData.transactions} isLoading={false} />
                </div>
              </>
            )}
            {!isLoadingWalletData && !walletFetchError && !walletData && (
               <p className="text-center text-gray-500 py-6">No wallet data available at the moment.</p>
            )}
          </div>
        </Card>
      </PageSection>
    </PageLayout>
  );
} 