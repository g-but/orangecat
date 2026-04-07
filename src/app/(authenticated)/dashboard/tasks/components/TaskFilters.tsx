import {
  TASK_CATEGORIES,
  TASK_STATUSES,
  TASK_TYPES,
  TASK_CATEGORY_LABELS,
  TASK_STATUS_LABELS,
  TASK_TYPE_LABELS,
} from '@/config/tasks';

type TaskCategory = (typeof TASK_CATEGORIES)[keyof typeof TASK_CATEGORIES];
type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES];
type TaskType = (typeof TASK_TYPES)[keyof typeof TASK_TYPES];

interface TaskFiltersProps {
  categoryFilter: TaskCategory | '';
  statusFilter: TaskStatus | '';
  typeFilter: TaskType | '';
  showArchived: boolean;
  onCategoryChange: (value: TaskCategory | '') => void;
  onStatusChange: (value: TaskStatus | '') => void;
  onTypeChange: (value: TaskType | '') => void;
  onShowArchivedChange: (value: boolean) => void;
}

export default function TaskFilters({
  categoryFilter,
  statusFilter,
  typeFilter,
  showArchived,
  onCategoryChange,
  onStatusChange,
  onTypeChange,
  onShowArchivedChange,
}: TaskFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={categoryFilter}
            onChange={e => onCategoryChange(e.target.value as TaskCategory | '')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tiffany-500"
          >
            <option value="">All categories</option>
            {Object.entries(TASK_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={e => onStatusChange(e.target.value as TaskStatus | '')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tiffany-500"
          >
            <option value="">All statuses</option>
            {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={typeFilter}
            onChange={e => onTypeChange(e.target.value as TaskType | '')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tiffany-500"
          >
            <option value="">All types</option>
            {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={e => onShowArchivedChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-tiffany-600 focus:ring-tiffany-500"
          />
          <span>Show archived</span>
        </label>
      </div>
    </div>
  );
}
