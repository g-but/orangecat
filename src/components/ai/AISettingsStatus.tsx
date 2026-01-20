'use client';

import { Bot, Key, Zap, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AISettingsStatusProps {
  hasByok: boolean;
  byokProvider?: string;
  dailyUsage?: {
    used: number;
    limit: number;
  };
  onSetupClick?: () => void;
  compact?: boolean;
}

/**
 * AISettingsStatus - Shows BYOK Active vs Free Tier status
 *
 * Displays:
 * - BYOK Active: Shows provider, green status badge
 * - Free Tier: Shows usage bar, upgrade prompt
 */
export function AISettingsStatus({
  hasByok,
  byokProvider,
  dailyUsage = { used: 0, limit: 10 },
  onSetupClick,
  compact = false,
}: AISettingsStatusProps) {
  const usagePercent = Math.min((dailyUsage.used / dailyUsage.limit) * 100, 100);
  const isNearLimit = usagePercent >= 80;

  if (hasByok) {
    return (
      <Card className={cn('border-green-200 bg-green-50/50', compact && 'p-4')}>
        {!compact && (
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Key className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-green-800">BYOK Active</CardTitle>
                  <CardDescription className="text-green-600">
                    Your own API key is configured
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardHeader>
        )}
        <CardContent className={cn(compact && 'p-0')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {compact && <Key className="w-4 h-4 text-green-600" />}
              <span className="text-sm text-green-700">
                {compact ? 'BYOK Active' : `Provider: ${byokProvider || 'OpenRouter'}`}
              </span>
            </div>
            <Link href="/settings/ai">
              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                Manage
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Free Tier Status
  return (
    <Card className={cn('border-amber-200 bg-amber-50/50', compact && 'p-4')}>
      {!compact && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-amber-800">Free Tier</CardTitle>
                <CardDescription className="text-amber-600">
                  {dailyUsage.limit} messages per day
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
              <Zap className="w-3 h-3 mr-1" />
              Free
            </Badge>
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(compact && 'p-0')}>
        <div className="space-y-3">
          {/* Usage Bar */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className={cn('font-medium', isNearLimit ? 'text-red-600' : 'text-amber-700')}>
                {dailyUsage.used} / {dailyUsage.limit} messages today
              </span>
              <span className="text-amber-600">{Math.round(usagePercent)}%</span>
            </div>
            <Progress
              value={usagePercent}
              className={cn('h-2', isNearLimit ? '[&>div]:bg-red-500' : '[&>div]:bg-amber-500')}
            />
          </div>

          {/* Near Limit Warning */}
          {isNearLimit && !compact && (
            <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">
                You are running low on free messages. Add your own API key for unlimited usage.
              </p>
            </div>
          )}

          {/* Upgrade CTA */}
          <div className="flex items-center justify-between pt-1">
            {compact ? (
              <>
                <span className="text-sm text-amber-700">
                  {dailyUsage.used}/{dailyUsage.limit} today
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-600 hover:text-amber-700"
                  onClick={onSetupClick}
                >
                  Add Key
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="w-full bg-amber-600 hover:bg-amber-700"
                onClick={onSetupClick}
              >
                <Key className="w-4 h-4 mr-2" />
                Add Your API Key for Unlimited Usage
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AISettingsStatus;
