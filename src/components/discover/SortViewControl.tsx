'use client';

import { Grid3X3, List } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortOption } from '@/services/search';

export type ViewMode = 'grid' | 'list';

interface SortViewControlProps {
  isMobile: boolean;
  sortBy: SortOption;
  onSortChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const LABEL_CLASS = 'block text-sm font-medium text-fg-primary mb-2';
const VIEW_WRAP_CLASS = 'flex gap-1 rounded-md border border-default bg-surface-base p-1';

export function SortViewControl({
  isMobile,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: SortViewControlProps) {
  const sortSelect = (
    <Select value={sortBy} onValueChange={onSortChange}>
      <SelectTrigger aria-label="Sort by">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="recent">Newest</SelectItem>
        <SelectItem value="relevance">Relevance</SelectItem>
      </SelectContent>
    </Select>
  );

  const viewButtons = (
    <div className={VIEW_WRAP_CLASS}>
      <Button
        variant={viewMode === 'grid' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('grid')}
        className="flex-1 h-11"
      >
        <Grid3X3 className={`w-4 h-4${isMobile ? '' : ' mr-1'}`} />
        {!isMobile && 'Grid'}
      </Button>
      <Button
        variant={viewMode === 'list' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('list')}
        className="flex-1 h-11"
      >
        <List className={`w-4 h-4${isMobile ? '' : ' mr-1'}`} />
        {!isMobile && 'List'}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className={LABEL_CLASS}>Sort</label>
          {sortSelect}
        </div>
        <div>
          <label className={LABEL_CLASS}>View</label>
          {viewButtons}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <label className={LABEL_CLASS}>Sort by</label>
        {sortSelect}
      </div>
      <div className="mb-6">
        <label className={LABEL_CLASS}>View</label>
        {viewButtons}
      </div>
    </>
  );
}
