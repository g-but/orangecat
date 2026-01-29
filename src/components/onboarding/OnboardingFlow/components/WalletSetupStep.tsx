/**
 * WALLET SETUP STEP COMPONENT
 * Second step - guides user to add their Bitcoin address
 */

import { Card, CardContent } from '@/components/ui/Card';
import { Bitcoin, Sparkles, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export function WalletSetupStep() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bitcoin className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Add Your Bitcoin Address</h3>
        <p className="text-muted-foreground">
          Paste your Bitcoin wallet address so supporters can send you Bitcoin directly. You keep
          full control of your funds.
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-900">Without a Bitcoin address:</p>
            <ul className="text-sm text-amber-800 mt-1 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
                Supporters can't send you Bitcoin
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
                Your projects won't receive funding
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
                You'll miss out on the full OrangeCat experience
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Sparkles className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-2">How It Works</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">1.</span>
                  <span>
                    <strong>Get your address</strong> from your Bitcoin wallet (Muun, BlueWallet,
                    Ledger, etc.)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">2.</span>
                  <span>
                    <strong>Paste it</strong> in your OrangeCat wallet settings
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">3.</span>
                  <span>
                    <strong>Receive Bitcoin</strong> directly when your projects get funded
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Self-Custody</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your Bitcoin goes directly to your wallet. We never hold your funds.
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="font-medium">No Fees</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Zero platform fees on funding. You keep 100% of what's sent.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Recommendations */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Bitcoin className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">Need a Bitcoin wallet?</p>
            <p className="text-xs text-gray-600 mt-1 mb-2">
              We recommend these beginner-friendly wallets:
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://muun.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
              >
                Muun <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="https://bluewallet.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
              >
                BlueWallet <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="https://phoenix.acinq.co"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
              >
                Phoenix <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              You can skip for now, but you'll need to add a wallet address before receiving any
              Bitcoin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
