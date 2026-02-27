'use client';

import { useState } from 'react';
import { Plus, Bitcoin } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { WalletAddressCard } from './WalletAddressCard';
import { WalletAddModal } from './WalletAddModal';

export interface WalletAddress {
  id: string;
  name: string;
  address: string;
  type: 'bitcoin' | 'lightning' | 'ethereum' | 'solana' | 'other';
  category: 'personal' | 'organization' | 'project' | 'friend' | 'business' | 'donation';
  description?: string;
  tags: string[];
  isFavorite: boolean;
  isPublic: boolean;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

const sampleAddresses: WalletAddress[] = [
  {
    id: '1',
    name: 'My Main Bitcoin Wallet',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    type: 'bitcoin',
    category: 'personal',
    description: 'Primary Bitcoin address for receiving funding',
    tags: ['primary', 'funding', 'bitcoin'],
    isFavorite: true,
    isPublic: true,
    createdAt: '2024-01-15T10:30:00Z',
    lastUsed: '2024-01-20T14:22:00Z',
    usageCount: 5,
  },
  {
    id: '2',
    name: 'Lightning Network',
    address:
      'lightning:lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpl2pkx2ctnv5sxxmmwwd5kgetjypeh2ursdae8g6twvus8g6rfwvs8qun0dfjkxaq8rkx3yf5tcsyz3d73gafnh3cax9rn449d9p5uxz9ezhhypd0elx87sjle52x86fux2ypatgddc6k63n7erqz25le42c4u4ecky03ylcqca784w',
    type: 'lightning',
    category: 'personal',
    description: 'Lightning Network address for instant payments',
    tags: ['lightning', 'fast', 'micropayments'],
    isFavorite: false,
    isPublic: true,
    createdAt: '2024-01-16T09:15:00Z',
    lastUsed: '2024-01-19T16:45:00Z',
    usageCount: 3,
  },
  {
    id: '3',
    name: 'Orange Cat Treasury',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    type: 'bitcoin',
    category: 'organization',
    description: 'Orange Cat organization treasury for subscription funding',
    tags: ['organization', 'treasury', 'subscriptions'],
    isFavorite: true,
    isPublic: true,
    createdAt: '2024-01-17T11:20:00Z',
    lastUsed: '2024-01-18T13:30:00Z',
    usageCount: 2,
  },
];

export default function WalletVault() {
  const [addresses, setAddresses] = useState<WalletAddress[]>(sampleAddresses);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const filteredAddresses = addresses.filter(addr => {
    const matchesSearch =
      addr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      addr.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (addr.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return (
      matchesSearch &&
      (selectedCategory === 'all' || addr.category === selectedCategory) &&
      (selectedType === 'all' || addr.type === selectedType)
    );
  });

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (e) {
      console.warn('[WalletVault] Clipboard copy failed:', e);
    }
  };

  const toggleFavorite = (id: string) => {
    setAddresses(prev =>
      prev.map(addr => (addr.id === id ? { ...addr, isFavorite: !addr.isFavorite } : addr))
    );
  };

  const hasFilters = searchTerm || selectedCategory !== 'all' || selectedType !== 'all';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Bitcoin className="w-8 h-8 text-bitcoinOrange" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Wallet Vault</h1>
                <p className="text-sm text-gray-600">Your personal Bitcoin address book</p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-bitcoinOrange hover:bg-bitcoinOrange/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search addresses by name, address, or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Categories</option>
                <option value="personal">Personal</option>
                <option value="organization">Organization</option>
                <option value="project">Campaign</option>
                <option value="friend">Friend</option>
                <option value="business">Business</option>
                <option value="donation">Funding</option>
              </select>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                <option value="bitcoin">Bitcoin</option>
                <option value="lightning">Lightning</option>
                <option value="ethereum">Ethereum</option>
                <option value="solana">Solana</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAddresses.map((address, index) => (
            <WalletAddressCard
              key={address.id}
              address={address}
              index={index}
              copiedAddress={copiedAddress}
              onCopy={handleCopyAddress}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>

        {filteredAddresses.length === 0 && (
          <EmptyState
            icon={Bitcoin}
            title={hasFilters ? 'No addresses match your filters' : 'Your wallet vault is empty'}
            description={
              hasFilters
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first Bitcoin address'
            }
            action={
              <Button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="bg-bitcoinOrange hover:bg-bitcoinOrange/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Address
              </Button>
            }
          />
        )}

        <WalletAddModal open={showAddModal} onClose={() => setShowAddModal(false)} />
      </div>
    </div>
  );
}
