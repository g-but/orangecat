'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import Card from '@/components/ui/Card';

interface CompactStoryCardProps {
  emoji: string;
  name: string;
  role: string;
  location: string;
  goal: string;
  result: string;
  quote: string;
  fullStory?: string;
  gradient: string;
  index: number;
}

export default function CompactStoryCard({
  emoji,
  name,
  role,
  location,
  goal,
  result,
  quote,
  fullStory,
  gradient,
  index,
}: CompactStoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card
        className={`group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br ${gradient} overflow-hidden h-full`}
      >
        <div className="p-4 sm:p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${gradient.replace('from-', 'from-').replace('to-', 'to-').split(' ').slice(0, 2).join(' ')} flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-md`}>
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">{name}</h3>
              <p className="text-xs sm:text-sm text-gray-700 font-medium">{role}</p>
              <p className="text-xs text-gray-600">{location}</p>
            </div>
          </div>

          {/* Goal & Result */}
          <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
            <div className="flex items-start gap-2">
              <span className="text-gray-600 text-xs sm:text-sm font-medium min-w-[50px] sm:min-w-[60px]">Goal:</span>
              <span className="text-gray-900 text-xs sm:text-sm font-semibold">{goal}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-600 text-xs sm:text-sm font-medium min-w-[50px] sm:min-w-[60px]">Result:</span>
              <span className="text-green-700 text-xs sm:text-sm font-semibold">{result}</span>
            </div>
          </div>

          {/* Quote */}
          <blockquote className="text-gray-700 text-xs sm:text-sm italic border-l-2 sm:border-l-3 border-gray-300 pl-2 sm:pl-3 mb-3 sm:mb-4 flex-1">
            "{quote}"
          </blockquote>

          {/* Expand/Read Story */}
          {fullStory && (
            <>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-gray-700 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 overflow-hidden"
                >
                  {fullStory}
                </motion.div>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs sm:text-sm font-medium text-gray-900 hover:text-bitcoinOrange transition-colors flex items-center gap-1 group/btn mt-auto"
              >
                {isExpanded ? 'Show less' : 'Read full story'}
                <ArrowRight className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isExpanded ? 'rotate-90' : 'group-hover/btn:translate-x-1'}`} />
              </button>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
