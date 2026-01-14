'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bitcoin,
  Shield,
  Zap,
  Clock,
  Users,
  TrendingUp,
  Award,
  CheckCircle,
  AlertTriangle,
  Star,
  ExternalLink,
  Download,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';

export interface UserPreferences {
  experience: 'beginner' | 'intermediate' | 'advanced';
  privacy: 'low' | 'medium' | 'high';
  custody: 'custodial' | 'self-custody';
  frequency: 'occasional' | 'regular' | 'frequent';
  amount: 'small' | 'medium' | 'large';
  device: 'mobile' | 'desktop' | 'both';
  features: string[];
}

interface WalletRecommendation {
  wallet: any;
  score: number;
  reasons: string[];
  pros: string[];
  cons: string[];
}

export default function WalletRecommendation() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    experience: 'beginner',
    privacy: 'medium',
    custody: 'self-custody',
    frequency: 'regular',
    amount: 'medium',
    device: 'both',
    features: [],
  });

  const [showResults, setShowResults] = useState(false);

  // This would come from the wallet data
  const wallets = [
    {
      id: 'blue-wallet',
      name: 'BlueWallet',
      type: 'mobile',
      difficulty: 'beginner',
      privacyLevel: 'medium',
      custody: 'self-custody',
      features: ['lightning', 'watch-only', 'open-source'],
      rating: 4.6,
      recommended: true,
    },
    {
      id: 'electrum',
      name: 'Electrum',
      type: 'desktop',
      difficulty: 'intermediate',
      privacyLevel: 'high',
      custody: 'self-custody',
      features: ['hardware-wallet', 'advanced-privacy', 'open-source'],
      rating: 4.5,
      recommended: false,
    },
    {
      id: 'ledger-nano',
      name: 'Ledger Nano',
      type: 'hardware',
      difficulty: 'intermediate',
      privacyLevel: 'high',
      custody: 'self-custody',
      features: ['hardware-security', 'multi-crypto', 'offline-storage'],
      rating: 4.8,
      recommended: true,
    },
  ];

  const getRecommendations = (): WalletRecommendation[] => {
    return wallets
      .map(wallet => {
        let score = 0;
        const reasons: string[] = [];
        const pros: string[] = [];
        const cons: string[] = [];

        // Experience level scoring
        if (preferences.experience === 'beginner' && wallet.difficulty === 'beginner') {
          score += 30;
          reasons.push('Perfect for beginners');
          pros.push('Easy to use interface');
        } else if (
          preferences.experience === 'intermediate' &&
          wallet.difficulty === 'intermediate'
        ) {
          score += 25;
          reasons.push('Matches your experience level');
        } else if (preferences.experience === 'advanced' && wallet.difficulty === 'advanced') {
          score += 20;
          reasons.push('Advanced features for power users');
        }

        // Privacy level scoring
        if (preferences.privacy === 'high' && wallet.privacyLevel === 'high') {
          score += 25;
          reasons.push('High privacy protection');
          pros.push('Strong privacy features');
        } else if (preferences.privacy === 'medium' && wallet.privacyLevel === 'medium') {
          score += 20;
          reasons.push('Good balance of privacy and usability');
        }

        // Custody preference scoring
        if (preferences.custody === wallet.custody) {
          score += 20;
          reasons.push(`Matches your ${wallet.custody} preference`);
          if (wallet.custody === 'self-custody') {
            pros.push('You control your private keys');
          } else {
            pros.push('Convenient custodial service');
          }
        }

        // Device preference scoring
        if (preferences.device === 'both' || preferences.device === wallet.type) {
          score += 15;
          reasons.push(`Works on your preferred device (${wallet.type})`);
        }

        // Features scoring
        if (preferences.features.length > 0) {
          const matchingFeatures = wallet.features.filter(f =>
            preferences.features.some(pf => f.toLowerCase().includes(pf.toLowerCase()))
          );
          score += matchingFeatures.length * 5;
          if (matchingFeatures.length > 0) {
            reasons.push(`Supports ${matchingFeatures.length} of your preferred features`);
          }
        }

        // Rating bonus
        score += (wallet.rating - 4) * 5;

        // Recommended bonus
        if (wallet.recommended) {
          score += 10;
          reasons.push('Highly recommended by experts');
        }

        return {
          wallet,
          score: Math.round(score),
          reasons,
          pros: [],
          cons: [],
        };
      })
      .sort((a, b) => b.score - a.score);
  };

  const recommendations = getRecommendations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Bitcoin className="w-8 h-8 text-bitcoinOrange" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Wallet Recommendations</h1>
                <p className="text-sm text-gray-600">Find the perfect wallet for your needs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showResults ? (
          /* Preferences Form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your needs</h2>
              <p className="text-gray-600 mb-8">
                We'll recommend the best Bitcoin wallets based on your preferences and requirements.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Your Experience Level
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'beginner', label: 'Beginner', desc: 'New to Bitcoin' },
                      { value: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
                      { value: 'advanced', label: 'Advanced', desc: 'Power user' },
                    ].map(option => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="experience"
                          value={option.value}
                          checked={preferences.experience === option.value}
                          onChange={e => {
                            const value = e.target.value;
                            if (value === 'beginner' || value === 'intermediate' || value === 'advanced') {
                              setPreferences(prev => ({
                                ...prev,
                                experience: value,
                              }));
                            }
                          }}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Privacy Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Privacy Level
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'low', label: 'Basic', desc: 'Simple, convenient' },
                      { value: 'medium', label: 'Standard', desc: 'Good balance' },
                      { value: 'high', label: 'Maximum', desc: 'Privacy focused' },
                    ].map(option => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="privacy"
                          value={option.value}
                          checked={preferences.privacy === option.value}
                          onChange={e => {
                            const value = e.target.value;
                            if (value === 'low' || value === 'medium' || value === 'high') {
                              setPreferences(prev => ({
                                ...prev,
                                privacy: value,
                              }));
                            }
                          }}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custody Preference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Key Control
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        value: 'self-custody',
                        label: 'Self-Custody',
                        desc: 'You control your keys',
                      },
                      { value: 'custodial', label: 'Custodial', desc: 'Third party holds keys' },
                    ].map(option => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="custody"
                          value={option.value}
                          checked={preferences.custody === option.value}
                          onChange={e => {
                            const value = e.target.value;
                            if (value === 'custodial' || value === 'self-custody') {
                              setPreferences(prev => ({
                                ...prev,
                                custody: value,
                              }));
                            }
                          }}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Device Preference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preferred Device
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'mobile', label: 'Mobile', desc: 'Phone or tablet' },
                      { value: 'desktop', label: 'Desktop', desc: 'Computer' },
                      { value: 'both', label: 'Both', desc: 'Mobile & desktop' },
                    ].map(option => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="device"
                          value={option.value}
                          checked={preferences.device === option.value}
                          onChange={e => {
                            const value = e.target.value;
                            if (value === 'mobile' || value === 'desktop' || value === 'both') {
                              setPreferences(prev => ({
                                ...prev,
                                device: value,
                              }));
                            }
                          }}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <Button
                  onClick={() => setShowResults(true)}
                  className="bg-bitcoinOrange hover:bg-bitcoinOrange/90 text-white px-8 py-3"
                >
                  Get My Recommendations
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          /* Results */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Results Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Your Personalized Wallet Recommendations
              </h2>
              <p className="text-gray-600">
                Based on your preferences, here are the best Bitcoin wallets for you
              </p>
            </div>

            {/* Recommendations */}
            <div className="space-y-6">
              {recommendations.slice(0, 3).map((rec, index) => (
                <motion.div
                  key={rec.wallet.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={`p-6 ${index === 0 ? 'ring-2 ring-bitcoinOrange border-bitcoinOrange' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            index === 0
                              ? 'bg-bitcoinOrange text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {index === 0 ? (
                            <Award className="w-6 h-6" />
                          ) : (
                            <span className="text-lg font-bold">#{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{rec.wallet.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{rec.wallet.rating}</span>
                            </div>
                            <Badge
                              className={
                                rec.wallet.difficulty === 'beginner'
                                  ? 'bg-green-100 text-green-700'
                                  : rec.wallet.difficulty === 'intermediate'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                              }
                            >
                              {rec.wallet.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-bitcoinOrange">{rec.score}%</div>
                        <div className="text-sm text-gray-500">Match Score</div>
                      </div>
                    </div>

                    {/* Reasons */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Why this wallet?
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {rec.reasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Pros & Cons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2">Pros</h4>
                        <ul className="space-y-1">
                          {rec.pros.slice(0, 3).map((pro, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <div className="w-1 h-1 bg-green-500 rounded-full mt-2" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-700 mb-2">Cons</h4>
                        <ul className="space-y-1">
                          {rec.cons.slice(0, 2).map((con, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => window.open(rec.wallet.downloadUrl, '_blank')}
                        className={`flex-1 ${index === 0 ? 'bg-bitcoinOrange hover:bg-bitcoinOrange/90 text-white' : ''}`}
                        variant={index === 0 ? 'primary' : 'outline'}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Get {rec.wallet.name}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                      {index === 0 && <Button variant="outline">Learn More</Button>}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Reset Button */}
            <div className="text-center">
              <Button variant="outline" onClick={() => setShowResults(false)} className="px-8">
                Change Preferences
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
