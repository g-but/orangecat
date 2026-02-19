/**
 * ACTION BUTTON COMPONENT
 * Button for suggested entity creation and wallet creation actions
 *
 * Uses ENTITY_REGISTRY as SSOT for entity metadata including icons.
 */

import { cn } from '@/lib/utils';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { Plus } from 'lucide-react';
import type { CatAction } from '../types';

interface ActionButtonProps {
  action: CatAction;
  onClick: () => void;
}

export function ActionButton({ action, onClick }: ActionButtonProps) {
  if (action.type === 'suggest_wallet') {
    const WalletIcon = ENTITY_REGISTRY.wallet.icon;
    return (
      <button
        onClick={onClick}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl',
          'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
          'text-white font-medium text-sm shadow-md hover:shadow-lg',
          'transition-all transform hover:scale-[1.02]'
        )}
      >
        <Plus className="h-4 w-4" />
        <WalletIcon className="h-4 w-4" />
        <span>Create Wallet: {action.prefill.label}</span>
      </button>
    );
  }

  // create_entity action
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
