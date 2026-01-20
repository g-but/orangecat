/**
 * Model Status Badge
 *
 * Shows the current AI model being used with a simple, non-intrusive badge.
 * For free tier users, shows "Free" badge.
 * For BYOK users, shows model name.
 */

'use client';

import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Sparkles, Zap, Crown } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ModelStatusBadgeProps {
  modelName?: string;
  isFree?: boolean;
  hasByok?: boolean;
  messagesRemaining?: number;
  onUpgrade?: () => void;
}

export function ModelStatusBadge({
  modelName = 'Llama 4 Maverick',
  isFree = true,
  hasByok = false,
  messagesRemaining,
  onUpgrade,
}: ModelStatusBadgeProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Badge
          variant={isFree ? 'secondary' : 'default'}
          className="cursor-pointer gap-1.5"
        >
          {isFree && <Zap className="h-3 w-3" />}
          {hasByok && <Crown className="h-3 w-3" />}
          <span className="text-xs">{isFree ? 'Free' : modelName}</span>
        </Badge>
      </HoverCardTrigger>

      <HoverCardContent className="w-80" align="start">
        <div className="space-y-3">
          {/* Current Model */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-tiffany" />
              <h4 className="font-semibold text-sm">Current Model</h4>
            </div>
            <p className="text-sm text-muted-foreground">{modelName}</p>
          </div>

          {/* Free Tier Info */}
          {isFree && (
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Free Messages</span>
                {typeof messagesRemaining === 'number' && (
                  <Badge variant="outline" className="text-xs">
                    {messagesRemaining} remaining today
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                You're using a free AI model. No setup required, no costs.
                Perfect for getting started!
              </p>

              {onUpgrade && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={onUpgrade}
                >
                  Upgrade to Premium Models
                </Button>
              )}
            </div>
          )}

          {/* BYOK Info */}
          {hasByok && (
            <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium">Premium Access</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Using your own API key. Unlimited messages, your choice of
                models.
              </p>
            </div>
          )}

          {/* Benefits */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">✓ Benefits:</p>
            <ul className="space-y-0.5 ml-4">
              <li>• No conversation data stored</li>
              <li>• 100% private and secure</li>
              <li>• Fast streaming responses</li>
              {isFree && <li>• Zero setup required</li>}
              {hasByok && <li>• Your choice of 200+ models</li>}
            </ul>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
