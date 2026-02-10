/**
 * CHAT HEADER COMPONENT
 * Header with avatar, badges, and controls
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ModelSelector, ModelBadge } from '../../ModelSelector';
import { Cat as CatIcon, Key, Gift, Settings as SettingsIcon, Wifi, WifiOff } from 'lucide-react';
import type { UserStatus } from '../types';

interface ChatHeaderProps {
  userStatus: UserStatus | null;
  lastModelUsed: string | null;
  localEnabled: boolean;
  localHealthy: boolean | null;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onSettingsClick: () => void;
}

export function ChatHeader({
  userStatus,
  lastModelUsed,
  localEnabled,
  localHealthy,
  selectedModel,
  onModelChange,
  onSettingsClick,
}: ChatHeaderProps) {
  const headerBadge = (() => {
    if (userStatus?.hasByok) {
      return (
        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
          <Key className="h-3 w-3 mr-1" /> BYOK
        </Badge>
      );
    }
    if (userStatus) {
      return (
        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
          <Gift className="h-3 w-3 mr-1" />
          {userStatus.freeMessagesRemaining}/{userStatus.freeMessagesPerDay} free
        </Badge>
      );
    }
    return null;
  })();

  return (
    <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-200">
      <Avatar className="h-10 w-10">
        <AvatarImage src={undefined} />
        <AvatarFallback className="bg-orange-100 text-orange-600">
          <CatIcon className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900 truncate">My Cat</h2>
          <Badge variant="secondary" className="bg-gray-50 text-gray-600 border-gray-200">
            Private — not saved
          </Badge>
          {headerBadge}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {lastModelUsed && <ModelBadge modelId={lastModelUsed} />}
        </div>
      </div>

      {/* Local/Remote controls */}
      <div className="flex items-center gap-2">
        {localEnabled && (
          <Badge
            variant="secondary"
            className={`border ${
              localHealthy
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : localHealthy === false
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}
          >
            {localHealthy ? (
              <Wifi className="h-3 w-3 mr-1" />
            ) : localHealthy === false ? (
              <WifiOff className="h-3 w-3 mr-1" />
            ) : (
              <Wifi className="h-3 w-3 mr-1" />
            )}
            Local
          </Badge>
        )}
        <button
          className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={onSettingsClick}
          title="Local model settings"
        >
          <SettingsIcon className="h-5 w-5 text-gray-600" />
        </button>
        {!localEnabled && (
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            size="sm"
            showPricing={true}
          />
        )}
      </div>
    </div>
  );
}
