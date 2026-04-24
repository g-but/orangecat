'use client';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface WalletAddModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletAddModal({ open, onClose }: WalletAddModalProps) {
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>Add Bitcoin Address</DialogTitle>
            <div className="">
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
                    <option value="project">Project</option>
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
      </DialogContent>
    </Dialog>
  );
}
