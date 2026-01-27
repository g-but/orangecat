/**
 * WalletResultsView Component
 *
 * Displays wallet recommendations based on user preferences.
 * Extracted from WalletRecommendation component.
 */

'use client';

import { motion } from 'framer-motion';
import { Award, CheckCircle, Star, ExternalLink, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { WalletRecommendation } from './useWalletRecommendation';

interface WalletResultsViewProps {
  recommendations: WalletRecommendation[];
  onChangePreferences: () => void;
}

function WalletCard({ rec, index }: { rec: WalletRecommendation; index: number }) {
  const isTop = index === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`p-6 ${isTop ? 'ring-2 ring-bitcoinOrange border-bitcoinOrange' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isTop ? 'bg-bitcoinOrange text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isTop ? (
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
            className={`flex-1 ${isTop ? 'bg-bitcoinOrange hover:bg-bitcoinOrange/90 text-white' : ''}`}
            variant={isTop ? 'primary' : 'outline'}
          >
            <Download className="w-4 h-4 mr-2" />
            Get {rec.wallet.name}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          {isTop && <Button variant="outline">Learn More</Button>}
        </div>
      </Card>
    </motion.div>
  );
}

export function WalletResultsView({
  recommendations,
  onChangePreferences,
}: WalletResultsViewProps) {
  return (
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
          <WalletCard key={rec.wallet.id} rec={rec} index={index} />
        ))}
      </div>

      {/* Reset Button */}
      <div className="text-center">
        <Button variant="outline" onClick={onChangePreferences} className="px-8">
          Change Preferences
        </Button>
      </div>
    </motion.div>
  );
}
