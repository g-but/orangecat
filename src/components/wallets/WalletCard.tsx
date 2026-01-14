'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bitcoin,
  Smartphone,
  Monitor,
  Globe,
  Shield,
  Eye,
  EyeOff,
  Star,
  CheckCircle,
  AlertTriangle,
  Download,
  ExternalLink,
  Award,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WalletProvider } from '@/data/walletProviders';

interface WalletCardProps {
  wallet: WalletProvider;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

const getTypeIcon = (type: WalletProvider['type']) => {
  switch (type) {
    case 'hardware':
      return Shield;
    case 'mobile':
      return Smartphone;
    case 'desktop':
      return Monitor;
    case 'browser':
      return Globe;
    default:
      return Bitcoin;
  }
};

const getDifficultyColor = (difficulty: WalletProvider['difficulty']) => {
  switch (difficulty) {
    case 'beginner':
      return 'text-green-600 bg-green-50';
    case 'intermediate':
      return 'text-yellow-600 bg-yellow-50';
    case 'advanced':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getPrivacyColor = (level: WalletProvider['privacyLevel']) => {
  switch (level) {
    case 'high':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

const getCustodyColor = (custody: WalletProvider['custody']) => {
  switch (custody) {
    case 'self-custody':
      return 'text-green-600 bg-green-50';
    case 'custodial':
      return 'text-red-600 bg-red-50';
    case 'hybrid':
      return 'text-yellow-600 bg-yellow-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export function WalletCard({ wallet, isExpanded, onToggle, className }: WalletCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const TypeIcon = getTypeIcon(wallet.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn('w-full', className)}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-orange-50 rounded-lg">
                <TypeIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-gray-900">{wallet.name}</h3>
                  {wallet.recommended && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      <Award className="w-3 h-3 mr-1" />
                      Recommended
                    </Badge>
                  )}
                  {wallet.verified && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <p className="text-gray-600 mb-2">{wallet.description}</p>

                {/* Rating and Reviews */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{wallet.rating}</span>
                  </div>
                  <span>•</span>
                  <span>{wallet.reviewCount.toLocaleString()} reviews</span>
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={onToggle} className="ml-4">
              {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className={getDifficultyColor(wallet.difficulty)}>{wallet.difficulty}</Badge>
            <Badge className={getCustodyColor(wallet.custody)}>
              {wallet.custody.replace('-', ' ')}
            </Badge>
            <Badge variant="outline" className={getPrivacyColor(wallet.privacyLevel)}>
              {wallet.privacyLevel} privacy
            </Badge>
            <Badge variant="outline">{wallet.setupTime}min setup</Badge>
          </div>

          {/* Features */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {wallet.features.slice(0, 3).map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {feature}
                </span>
              ))}
              {wallet.features.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                  +{wallet.features.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <a
              href={wallet.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Button variant="outline" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Website
              </Button>
            </a>
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-100"
            >
              <div className="p-6 bg-gray-50">
                {/* Long Description */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">About</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{wallet.longDescription}</p>
                </div>

                {/* Pros and Cons */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Pros
                    </h4>
                    <ul className="space-y-2">
                      {wallet.pros.map((pro, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Cons
                    </h4>
                    <ul className="space-y-2">
                      {wallet.cons.map((con, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Technical Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Platforms:</span>
                        <span className="font-medium">{wallet.supportedPlatforms.join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Networks:</span>
                        <span className="font-medium">{wallet.supportedNetworks.join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Countries:</span>
                        <span className="font-medium">{wallet.countries.join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fees:</span>
                        <span className="font-medium capitalize">{wallet.fees}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Security Features</h4>
                    <div className="flex flex-wrap gap-1">
                      {wallet.securityFeatures.map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
