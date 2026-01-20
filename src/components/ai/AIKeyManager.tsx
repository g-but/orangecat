'use client';

import { useState } from 'react';
import {
  Key,
  Plus,
  Trash2,
  Star,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { aiProviders, getAIProvider, validateApiKeyFormat } from '@/data/aiProviders';

// API Key structure from api-key-service.ts
export interface UserApiKey {
  id: string;
  user_id: string;
  provider: string;
  key_name: string;
  key_hint: string;
  is_valid: boolean;
  is_primary: boolean;
  last_validated_at: string | null;
  last_used_at: string | null;
  total_requests: number;
  total_tokens_used: number;
  created_at: string;
  updated_at: string;
}

interface AIKeyManagerProps {
  keys: UserApiKey[];
  onAdd?: (data: { provider: string; apiKey: string; keyName: string }) => Promise<void>;
  onDelete?: (keyId: string) => Promise<void>;
  onSetPrimary?: (keyId: string) => Promise<void>;
  isLoading?: boolean;
  onFieldFocus?: (field: string | null) => void;
}

/**
 * AIKeyManager - CRUD component for API keys
 *
 * Allows users to:
 * - Add new API keys
 * - Delete existing keys
 * - Set primary key
 * - View key hints and status
 */
export function AIKeyManager({
  keys,
  onAdd,
  onDelete,
  onSetPrimary,
  isLoading = false,
  onFieldFocus,
}: AIKeyManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [keyName, setKeyName] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<UserApiKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provider = getAIProvider(selectedProvider);

  const handleSubmit = async () => {
    if (!apiKey || !provider) {
      return;
    }

    // Validate format
    const validation = validateApiKeyFormat(selectedProvider, apiKey);
    if (!validation.valid) {
      setError(validation.message || 'Invalid API key format');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAdd?.({
        provider: selectedProvider,
        apiKey,
        keyName: keyName || `${provider.name} Key`,
      });

      // Reset form
      setApiKey('');
      setKeyName('');
      setIsAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!keyToDelete || !onDelete) {
      return;
    }

    try {
      await onDelete(keyToDelete.id);
      setKeyToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete key');
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Keys */}
      {keys.length > 0 && (
        <div className="space-y-3">
          {keys.map(key => {
            const keyProvider = getAIProvider(key.provider);
            return (
              <Card key={key.id} variant="minimal" className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        key.is_valid ? 'bg-green-100' : 'bg-red-100'
                      )}
                    >
                      <Key
                        className={cn('w-5 h-5', key.is_valid ? 'text-green-600' : 'text-red-600')}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key.key_name}</span>
                        {key.is_primary && (
                          <Badge className="bg-tiffany-100 text-tiffany-800 border-tiffany-200">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Primary
                          </Badge>
                        )}
                        {key.is_valid ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Invalid
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span>{keyProvider?.name || key.provider}</span>
                        <span>•</span>
                        <span className="font-mono">****{key.key_hint}</span>
                        {key.total_requests > 0 && (
                          <>
                            <span>•</span>
                            <span>{key.total_requests.toLocaleString()} requests</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!key.is_primary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSetPrimary?.(key.id)}
                        disabled={isLoading}
                        title="Set as primary"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setKeyToDelete(key)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Key Form */}
      {isAdding ? (
        <Card className="border-tiffany-200 bg-tiffany-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Add API Key</CardTitle>
            <CardDescription>Add your API key from your chosen provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
              <div
                className="grid grid-cols-2 md:grid-cols-4 gap-2"
                onFocus={() => onFieldFocus?.('provider')}
                onBlur={() => onFieldFocus?.(null)}
              >
                {aiProviders.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProvider(p.id)}
                    className={cn(
                      'p-3 rounded-lg border-2 text-left transition-all',
                      selectedProvider === p.id
                        ? 'border-tiffany-500 bg-tiffany-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.type}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Key Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Name (optional)
              </label>
              <Input
                value={keyName}
                onChange={e => setKeyName(e.target.value)}
                placeholder={`e.g., ${provider?.name || 'My'} Key for OrangeCat`}
              />
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => {
                    setApiKey(e.target.value);
                    setError(null);
                  }}
                  onFocus={() => onFieldFocus?.('apiKey')}
                  onBlur={() => onFieldFocus?.(null)}
                  placeholder={provider?.apiKeyExample || 'sk-...'}
                  className="pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {provider && (
                <p className="mt-1 text-xs text-gray-500">
                  Get your key at{' '}
                  <a
                    href={provider.apiKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-tiffany-600 hover:underline inline-flex items-center gap-1"
                  >
                    {provider.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setApiKey('');
                  setKeyName('');
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={!apiKey || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Add Key
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsAdding(true)}
          className="w-full justify-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add API Key
        </Button>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!keyToDelete} onOpenChange={() => setKeyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{keyToDelete?.key_name}&rdquo;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AIKeyManager;
