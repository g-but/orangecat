import { Search, Filter } from 'lucide-react'
import Input from './Input'
import Button from './Button'

interface SearchAndFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onFilterClick?: () => void
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

// Named export for projects page
export const ProjectsSearchAndFilter = SearchAndFilter