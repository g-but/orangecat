'use client';

/**
 * API Key Manager Component
 *
 * Allows users to manage their OpenRouter API keys (BYOK)
 * for unlimited AI assistant usage.
 */

import { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Trash2, Star, Check, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  provider: string;
  key_name: string;
  key_hint: string;
  is_valid: boolean;
  is_primary: boolean;
  last_used_at: string | null;
  total_requests: number;
  created_at: string;
}

interface PlatformUsage {
  daily_requests: number;
  daily_limit: number;
  requests_remaining: number;
  can_use_platform: boolean;
}

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [platformUsage, setPlatformUsage] = useState<PlatformUsage | null>(null);
  const [hasByok, setHasByok] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyName, setNewKeyName] = useState('Default');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
  } | null>(null);

  const loadKeys = useCallback(async () => {
    try {
      const response = await fetch('/api/user/api-keys');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setKeys(data.data.keys || []);
          setPlatformUsage(data.data.platformUsage);
          setHasByok(data.data.hasByok);
        }
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const validateKey = async () => {
    if (!newKeyValue.trim()) {
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch('/api/user/api-keys/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newKeyValue }),
      });

      const data = await response.json();
      if (data.success) {
        setValidationResult(data.data);
      } else {
        setValidationResult({ isValid: false, error: data.error });
      }
    } catch {
      setValidationResult({ isValid: false, error: 'Failed to validate key' });
    } finally {
      setIsValidating(false);
    }
  };

  const addKey = async () => {
    if (!newKeyValue.trim() || !validationResult?.isValid) {
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: newKeyValue,
          keyName: newKeyName || 'Default',
          isPrimary: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('API key added successfully');
        setShowAddForm(false);
        setNewKeyValue('');
        setNewKeyName('Default');
        setValidationResult(null);
        loadKeys();
      } else {
        toast.error(data.error || 'Failed to add API key');
      }
    } catch {
      toast.error('Failed to add API key');
    } finally {
      setIsAdding(false);
    }
  };

  const deleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('API key deleted');
        loadKeys();
      } else {
        toast.error('Failed to delete API key');
      }
    } catch {
      toast.error('Failed to delete API key');
    }
  };

  const setPrimary = async (keyId: string) => {
    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrimary: true }),
      });

      if (response.ok) {
        toast.success('Primary key updated');
        loadKeys();
      } else {
        toast.error('Failed to update primary key');
      }
    } catch {
      toast.error('Failed to update primary key');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            AI API Keys
          </CardTitle>
          <CardDescription>
            Add your own OpenRouter API key for unlimited AI assistant usage. Without a key, you get{' '}
            {platformUsage?.daily_limit || 10} free messages per day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Current Status */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            {hasByok ? (
              <>
                <div className="p-2 bg-green-100 rounded-full">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">BYOK Active</p>
                  <p className="text-sm text-gray-600">Using your own API key • Unlimited usage</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-amber-100 rounded-full">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-800">Free Tier</p>
                  <p className="text-sm text-gray-600">
                    {platformUsage?.requests_remaining || 0} of {platformUsage?.daily_limit || 10}{' '}
                    messages remaining today
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Progress bar for free tier */}
          {!hasByok && platformUsage && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Daily Usage</span>
                <span className="text-gray-700">
                  {platformUsage.daily_requests} / {platformUsage.daily_limit}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{
                    width: `${(platformUsage.daily_requests / platformUsage.daily_limit) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Keys List */}
      {keys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your API Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {keys.map(key => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{key.key_name}</span>
                      {key.is_primary && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                      {!key.is_valid && (
                        <Badge variant="destructive" className="text-xs">
                          Invalid
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {key.key_hint} • {key.total_requests.toLocaleString()} requests
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!key.is_primary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrimary(key.id)}
                      title="Set as primary"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteKey(key.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add Key Form */}
      {showAddForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add OpenRouter API Key</CardTitle>
            <CardDescription>
              Get your API key from{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tiffany hover:underline inline-flex items-center gap-1"
              >
                openrouter.ai/keys
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Key Name</label>
              <Input
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="e.g., Personal, Work"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <Input
                type="password"
                value={newKeyValue}
                onChange={e => {
                  setNewKeyValue(e.target.value);
                  setValidationResult(null);
                }}
                placeholder="sk-or-..."
              />
            </div>

            {/* Validation Result */}
            {validationResult && (
              <Alert variant={validationResult.isValid ? 'success' : 'destructive'}>
                <AlertDescription>
                  {validationResult.isValid ? (
                    <span className="flex items-center gap-2 text-green-700">
                      <Check className="h-4 w-4" />
                      API key is valid
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {validationResult.error || 'Invalid API key'}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setNewKeyValue('');
                setValidationResult(null);
              }}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={validateKey}
                disabled={!newKeyValue.trim() || isValidating}
              >
                {isValidating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Validate
              </Button>
              <Button onClick={addKey} disabled={!validationResult?.isValid || isAdding}>
                {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Key
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Button onClick={() => setShowAddForm(true)} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add API Key
        </Button>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-800 mb-2">Why add your own key?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>
              • <strong>Unlimited messages</strong> - No daily limits
            </li>
            <li>
              • <strong>All models</strong> - Access premium models like GPT-4o, Claude
            </li>
            <li>
              • <strong>Your usage</strong> - Pay OpenRouter directly at their rates
            </li>
            <li>
              • <strong>Free models too</strong> - Many models are free on OpenRouter
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
