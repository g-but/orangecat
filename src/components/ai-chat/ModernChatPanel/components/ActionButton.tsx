/**
 * ACTION BUTTON COMPONENT
 * Button for suggested entity creation actions
 *
 * Uses ENTITY_REGISTRY as SSOT for entity metadata including icons.
 */

import { cn } from '@/lib/utils';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { Plus } from 'lucide-react';
import type { SuggestedAction } from '../types';

interface ActionButtonProps {
  action: SuggestedAction;
  onClick: () => void;
}

export function ActionButton({ action, onClick }: ActionButtonProps) {
  const entityMeta = ENTITY_REGISTRY[action.entityType];
  const Icon = entityMeta?.icon || Plus;
  const entityName = entityMeta?.name || action.entityType;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl',
        'bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700',
        'text-white font-medium text-sm shadow-md hover:shadow-lg',
        'transition-all transform hover:scale-[1.02]'
      )}
    >
      <Plus className="h-4 w-4" />
      <Icon className="h-4 w-4" />
      <span>
        Create {entityName}: {action.prefill.title}
      </span>
    </button>
  );
}
