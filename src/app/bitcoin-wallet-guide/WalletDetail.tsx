'use client';

import { motion } from 'framer-motion';
import { Bitcoin, CheckCircle, AlertTriangle, Download, ExternalLink, Shield } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { WalletOption } from './config';

interface WalletDetailProps {
  wallet: WalletOption;
}

export function WalletDetail({ wallet }: WalletDetailProps) {
  return (
    <motion.div
      key={wallet.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="sticky top-8"
    >
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bitcoin className="w-5 h-5 text-bitcoinOrange" />
            {wallet.name}
          </CardTitle>
          <CardDescription>Detailed information and setup guide</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Advantages
            </h4>
            <ul className="space-y-1 text-sm">
              {wallet.pros.map((pro, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Considerations
            </h4>
            <ul className="space-y-1 text-sm">
              {wallet.cons.map((con, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                  {con}
                </li>
              ))}
            </ul>
          </div>

          <Button
            onClick={() => window.open(wallet.downloadUrl, '_blank')}
            className="w-full bg-bitcoinOrange hover:bg-bitcoinOrange/90 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Get {wallet.name}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <strong className="text-red-800">Security Tip:</strong>
                <p className="text-red-700 mt-1">
                  Always download wallets from official websites. Save your recovery phrase in a
                  safe place - it&apos;s the only way to recover your Bitcoin if you lose access to
                  your wallet.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
