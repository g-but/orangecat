/**
 * MODEL SELECTOR COMPONENT
 * Dropdown for selecting AI model
 */

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { getFreeModels, getModelMetadata } from '@/config/ai-models';
import { Sparkles, ChevronDown, Check } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onSelect: (model: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ selectedModel, onSelect, disabled }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const freeModels = getFreeModels();
  const selectedMeta = getModelMetadata(selectedModel);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName =
    selectedModel === 'auto' ? 'Auto (Best Free)' : selectedMeta?.name || selectedModel;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
          'bg-gray-100 hover:bg-gray-200 transition-colors',
          'border border-gray-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Sparkles className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-gray-700 max-w-[120px] truncate">{displayName}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-gray-400 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
          {/* Auto option */}
          <button
            onClick={() => {
              onSelect('auto');
              setIsOpen(false);
            }}
            className={cn(
              'w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3',
              selectedModel === 'auto' && 'bg-orange-50'
            )}
          >
            <div className="flex-1">
              <div className="font-medium text-gray-900 flex items-center gap-2">
                Auto (Best Free)
                {selectedModel === 'auto' && <Check className="h-4 w-4 text-orange-500" />}
              </div>
              <div className="text-xs text-gray-500">Automatically selects the best model</div>
            </div>
          </button>

          <div className="h-px bg-gray-100 my-1" />

          {/* Free models */}
          <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase">Free Models</div>
          {freeModels.map(model => (
            <button
              key={model.id}
              onClick={() => {
                onSelect(model.id);
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3',
                selectedModel === model.id && 'bg-orange-50'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 flex items-center gap-2 truncate">
                  {model.name}
                  {selectedModel === model.id && (
                    <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {model.provider} • {model.rateLimit}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
