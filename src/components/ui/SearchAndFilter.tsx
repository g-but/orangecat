import { Search, Filter, X } from 'lucide-react'
import Input from './Input'
import Button from './Button'
import { Badge } from './badge'

interface SearchAndFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onFilterClick?: () => void
  placeholder?: string
}

interface FilterOption {
  value: string
  label: string
}

interface FilterItem {
  key: string
  label: string
  type: 'select' | 'multiselect'
  options: FilterOption[]
  value: string | string[]
  onChange: (value: string | string[]) => void
}

interface ProjectsSearchAndFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onSearch?: () => void
  isLoading?: boolean
  showFilters: boolean
  onToggleFilters: () => void
  filters: FilterItem[]
  onClearFilters: () => void
  placeholder?: string
}

export default function SearchAndFilter({
  searchValue,
  onSearchChange,
  onFilterClick,
  placeholder = "Search..."
}: SearchAndFilterProps) {
  return (
    <div className="flex gap-4 items-center mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      {onFilterClick && (
        <Button
          variant="outline"
          onClick={onFilterClick}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      )}
    </div>
  )
}

// Projects-specific search and filter component
export function ProjectsSearchAndFilter({
  searchValue,
  onSearchChange,
  onSearch,
  isLoading = false,
  showFilters,
  onToggleFilters,
  filters,
  onClearFilters,
  placeholder = "Search projects..."
}: ProjectsSearchAndFilterProps) {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onSearch) {
                onSearch()
              }
            }}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
        {onSearch && (
          <Button onClick={onSearch} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Filters</h3>
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="text-sm font-medium">{filter.label}</label>
                {filter.type === 'select' ? (
                  <select
                    value={filter.value as string}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1">
                    {filter.options.map((option) => (
                      <label key={option.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(filter.value as string[]).includes(option.value)}
                          onChange={(e) => {
                            const currentValues = filter.value as string[]
                            const newValues = e.target.checked
                              ? [...currentValues, option.value]
                              : currentValues.filter(v => v !== option.value)
                            filter.onChange(newValues)
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const value = filter.value
              if (filter.type === 'select' && value && value !== 'all') {
                const option = filter.options.find(opt => opt.value === value)
                return option ? (
                  <Badge key={filter.key} variant="secondary" className="flex items-center gap-1">
                    {filter.label}: {option.label}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => filter.onChange('all')}
                    />
                  </Badge>
                ) : null
              }
              if (filter.type === 'multiselect' && Array.isArray(value) && value.length > 0) {
                return value.map(v => {
                  const option = filter.options.find(opt => opt.value === v)
                  return option ? (
                    <Badge key={`${filter.key}-${v}`} variant="secondary" className="flex items-center gap-1">
                      {filter.label}: {option.label}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => {
                          const newValues = (filter.value as string[]).filter(val => val !== v)
                          filter.onChange(newValues)
                        }}
                      />
                    </Badge>
                  ) : null
                })
              }
              return null
            })}
          </div>
        </div>
      )}
    </div>
  )
}