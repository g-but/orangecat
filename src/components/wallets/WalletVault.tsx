'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Copy,
  Check,
  Edit,
  Trash2,
  Bitcoin,
  Zap,
  Users,
  Building,
  Heart,
  Star,
  Clock,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';

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

    const matchesCategory = selectedCategory === 'all' || addr.category === selectedCategory;
    const matchesType = selectedType === 'all' || addr.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const getTypeIcon = (type: WalletAddress['type']) => {
    switch (type) {
      case 'bitcoin':
        return Bitcoin;
      case 'lightning':
        return Zap;
      case 'ethereum':
        return () => <span className="font-bold text-bitcoinOrange">Ξ</span>;
      case 'solana':
        return () => <span className="font-bold text-bitcoinOrange">◎</span>;
      default:
        return () => <span className="font-bold text-bitcoinOrange">₿</span>;
    }
  };

  const getCategoryIcon = (category: WalletAddress['category']) => {
    switch (category) {
      case 'personal':
        return Users;
      case 'organization':
        return Building;
      case 'project':
        return Heart;
      case 'friend':
        return Users;
      case 'business':
        return Building;
      case 'donation':
        return Heart;
      default:
        return Users;
    }
  };

  const getCategoryColor = (category: WalletAddress['category']) => {
    switch (category) {
      case 'personal':
        return 'bg-blue-100 text-blue-700';
      case 'organization':
        return 'bg-purple-100 text-purple-700';
      case 'project':
        return 'bg-pink-100 text-pink-700';
      case 'friend':
        return 'bg-green-100 text-green-700';
      case 'business':
        return 'bg-orange-100 text-orange-700';
      case 'donation':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {}
  };

  const toggleFavorite = (id: string) => {
    setAddresses(prev =>
      prev.map(addr => (addr.id === id ? { ...addr, isFavorite: !addr.isFavorite } : addr))
    );
  };

  const formatAddress = (address: string) => {
    if (address.length <= 20) {
      return address;
    }
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
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
        {/* Filters and Search */}
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

        {/* Address Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAddresses.map((address, index) => {
            const CategoryIcon = getCategoryIcon(address.category);
            const TypeIcon = getTypeIcon(address.type);

            return (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-200 border-2 hover:border-bitcoinOrange/50">
                  <div className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-bitcoinOrange/10 rounded-lg">
                          <TypeIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg truncate">{address.name}</h3>
                            {address.isFavorite && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getCategoryColor(address.category)}>
                              <CategoryIcon className="w-3 h-3 mr-1" />
                              {address.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-0">
                    {/* Address Display */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Address</p>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <code className="text-sm font-mono flex-1 break-all">
                          {formatAddress(address.address)}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyAddress(address.address)}
                          className="flex-shrink-0"
                        >
                          {copiedAddress === address.address ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Description */}
                    {address.description && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">{address.description}</p>
                      </div>
                    )}

                    {/* Tags */}
                    {address.tags.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {address.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Used {address.usageCount}x
                        </span>
                        {address.lastUsed && (
                          <span>Last: {new Date(address.lastUsed).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleFavorite(address.id)}
                          className="p-1"
                        >
                          <Heart
                            className={`w-3 h-3 ${address.isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                          />
                        </Button>
                        <Button variant="outline" size="sm" className="p-1">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="p-1 text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAddresses.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Bitcoin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || selectedCategory !== 'all' || selectedType !== 'all'
                ? 'No addresses match your filters'
                : 'Your wallet vault is empty'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== 'all' || selectedType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first Bitcoin address'}
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-bitcoinOrange hover:bg-bitcoinOrange/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Address
            </Button>
          </motion.div>
        )}

        {/* Add Address Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Bitcoin Address</h2>

                  {/* Form would go here - simplified for demo */}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
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
                    <Button
                      onClick={() => setShowAddModal(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setShowAddModal(false)}
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
      </div>
    </div>
  );
}
