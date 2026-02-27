'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface WalletAddModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletAddModal({ open, onClose }: WalletAddModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Add Bitcoin Address</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Name
                  </label>
                  <Input placeholder="e.g., My Main Wallet, Orange Cat Treasury" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitcoin Address
                  </label>
                  <Input placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Network Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="bitcoin">Bitcoin (BTC)</option>
                    <option value="lightning">Lightning Network (LN)</option>
                    <option value="ethereum">Ethereum (ETH)</option>
                    <option value="solana">Solana (SOL)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="personal">Personal</option>
                    <option value="organization">Organization</option>
                    <option value="project">Campaign</option>
                    <option value="friend">Friend</option>
                    <option value="business">Business</option>
                    <option value="donation">Funding</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                    rows={3}
                    placeholder="Add a description to help you remember this address..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <Button onClick={onClose} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1 bg-bitcoinOrange hover:bg-bitcoinOrange/90 text-white"
                >
                  Add Address
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
