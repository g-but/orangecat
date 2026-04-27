'use client';

import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Info,
  Zap,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import type { Action, CategorySummary } from './types';

const RISK_COLORS = {
  low: 'text-green-600 bg-green-50',
  medium: 'text-amber-600 bg-amber-50',
  high: 'text-red-600 bg-red-50',
};

const RISK_ICONS = {
  low: ShieldCheck,
  medium: Shield,
  high: ShieldAlert,
};

interface ActionRowProps {
  action: Action;
  isCategoryEnabled: boolean;
  isSaving: boolean;
  isAnySaving: boolean;
  onToggle: (actionId: string, category: string, enabled: boolean) => void;
}

function ActionRow({ action, isCategoryEnabled, isSaving, isAnySaving, onToggle }: ActionRowProps) {
  const RiskIcon = RISK_ICONS[action.riskLevel];

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${
        isCategoryEnabled ? 'bg-white' : 'bg-gray-100 opacity-60'
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <Tooltip>
          <TooltipTrigger>
            <div className={`p-1.5 rounded ${RISK_COLORS[action.riskLevel]}`}>
              <RiskIcon className="h-4 w-4" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">{action.riskLevel} risk</p>
          </TooltipContent>
        </Tooltip>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 text-sm">{action.name}</span>
            {action.requiresConfirmation && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Requires confirmation
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">{action.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isCategoryEnabled ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Switch
                  checked={true}
                  onCheckedChange={checked => onToggle(action.id, action.category, checked)}
                  disabled={isSaving || isAnySaving}
                  className="data-[state=checked]:bg-tiffany"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle individual action (category must stay enabled)</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Enable the category first to configure this action</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

interface CategoryRowProps {
  cat: CategorySummary;
  actions: Action[];
  isExpanded: boolean;
  saving: string | null;
  onToggleExpanded: (id: string) => void;
  onToggleCategory: (id: string, enabled: boolean) => void;
  onToggleAction: (actionId: string, category: string, enabled: boolean) => void;
}

export function CategoryRow({
  cat,
  actions,
  isExpanded,
  saving,
  onToggleExpanded,
  onToggleCategory,
  onToggleAction,
}: CategoryRowProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => onToggleExpanded(cat.category)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{cat.name}</h3>
              <Badge variant="secondary" className="text-xs">
                {cat.enabledActionCount}/{cat.actionCount}
              </Badge>
            </div>
            <p className="text-base text-gray-500">{cat.description}</p>
          </div>
        </div>
        <Switch
          checked={cat.enabled}
          onCheckedChange={checked => onToggleCategory(cat.category, checked)}
          disabled={saving === cat.category}
        />
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="space-y-3">
            {actions.map(action => (
              <ActionRow
                key={action.id}
                action={action}
                isCategoryEnabled={cat.enabled}
                isSaving={saving === action.id}
                isAnySaving={saving === cat.category}
                onToggle={onToggleAction}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
