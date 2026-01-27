/**
 * TimelineSortingControls Component
 *
 * Renders sorting buttons for timeline feeds.
 */

'use client';

import Button from '@/components/ui/Button';
import { TrendingUp, Clock, Flame } from 'lucide-react';

interface TimelineSortingControlsProps {
  sortBy: 'recent' | 'trending' | 'popular';
  onSortChange: (sort: 'recent' | 'trending' | 'popular') => void;
}

export function TimelineSortingControls({ sortBy, onSortChange }: TimelineSortingControlsProps) {
  return (
    <div className="flex bg-white/50 rounded-xl p-1">
      <Button
        variant={sortBy === 'trending' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onSortChange('trending')}
        className={`px-3 py-2 text-sm ${sortBy === 'trending' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
      >
        <TrendingUp className="w-4 h-4 mr-1" />
        Trending
      </Button>
      <Button
        variant={sortBy === 'recent' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onSortChange('recent')}
        className={`px-3 py-2 text-sm ${sortBy === 'recent' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
      >
        <Clock className="w-4 h-4 mr-1" />
        Recent
      </Button>
      <Button
        variant={sortBy === 'popular' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onSortChange('popular')}
        className={`px-3 py-2 text-sm ${sortBy === 'popular' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
      >
        <Flame className="w-4 h-4 mr-1" />
        Popular
      </Button>
    </div>
  );
}
