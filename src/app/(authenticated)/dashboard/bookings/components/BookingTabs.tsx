import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'incoming' | 'confirmed' | 'history';
type FilterStatus = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface TabConfig {
  id: TabType;
  label: string;
  count?: number;
}

interface BookingTabsProps {
  tabs: TabConfig[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  filterStatus: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
}

export default function BookingTabs({
  tabs,
  activeTab,
  onTabChange,
  filterStatus,
  onFilterChange,
}: BookingTabsProps) {
  return (
    <>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    'ml-2 py-0.5 px-2 rounded-full text-xs',
                    activeTab === tab.id ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'history' && (
        <div className="mb-6 flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={e => onFilterChange(e.target.value as FilterStatus)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5"
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      )}
    </>
  );
}

export type { TabType, FilterStatus, TabConfig };
