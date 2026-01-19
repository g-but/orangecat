'use client';

/**
 * Recovery Codes Component
 *
 * Generates and displays backup recovery codes for users with MFA enabled.
 * Recovery codes can be used when the authenticator app is unavailable.
 *
 * @module auth/RecoveryCodes
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Key,
  Copy,
  Check,
  Download,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card';

interface RecoveryCodesProps {
  /**
   * Callback when codes are generated successfully
   */
  onCodesGenerated?: (codes: string[]) => void;
  /**
   * Callback to close/dismiss the component
   */
  onClose?: () => void;
  /**
   * Whether to show the generate button or just display codes
   * If codes are provided, they will be displayed directly
   */
  initialCodes?: string[];
}

/**
 * Generate recovery codes
 * In production, this should be done server-side with proper entropy
 */
function generateRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoiding similar chars (0/O, 1/I)

  for (let i = 0; i < count; i++) {
    let code = '';
    // Generate 8 character codes in format XXXX-XXXX
    for (let j = 0; j < 8; j++) {
      if (j === 4) {
        code += '-';
      }
      const randomIndex = Math.floor(Math.random() * chars.length);
      code += chars[randomIndex];
    }
    codes.push(code);
  }

  return codes;
}

export function RecoveryCodes({ onCodesGenerated, onClose, initialCodes }: RecoveryCodesProps) {
  const [codes, setCodes] = useState<string[]>(initialCodes || []);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  // Generate recovery codes
  const handleGenerateCodes = useCallback(async () => {
    setGenerating(true);

    // Simulate async generation (in production, this would be an API call)
    await new Promise(resolve => setTimeout(resolve, 500));

    const newCodes = generateRecoveryCodes(10);
    setCodes(newCodes);
    onCodesGenerated?.(newCodes);

    setGenerating(false);
  }, [onCodesGenerated]);

  // Copy all codes to clipboard
  const handleCopy = useCallback(() => {
    const codesText = codes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [codes]);

  // Download codes as text file
  const handleDownload = useCallback(() => {
    const codesText = [
      'OrangeCat Recovery Codes',
      '========================',
      '',
      'These codes can be used to access your account if you lose your authenticator device.',
      'Each code can only be used once.',
      '',
      'Keep these codes in a safe place!',
      '',
      ...codes.map((code, i) => `${i + 1}. ${code}`),
      '',
      `Generated: ${new Date().toISOString()}`,
    ].join('\n');

    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orangecat-recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [codes]);

  // Regenerate codes (requires confirmation)
  const handleRegenerate = useCallback(async () => {
    if (
      !window.confirm(
        'Are you sure you want to generate new codes? Your old codes will no longer work.'
      )
    ) {
      return;
    }
    await handleGenerateCodes();
  }, [handleGenerateCodes]);

  // Format codes for display
  const formattedCodes = useMemo(() => {
    return codes.map((code, index) => ({
      number: index + 1,
      code,
    }));
  }, [codes]);

  // No codes yet - show generate button
  if (codes.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <Key className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <CardTitle>Recovery Codes</CardTitle>
          <CardDescription>
            Generate backup codes in case you lose access to your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-800">Important</p>
                <p className="text-xs text-amber-700">
                  Recovery codes are your backup if you lose your authenticator device. Store them
                  securely and never share them with anyone.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={handleGenerateCodes} disabled={generating} className="w-full">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Generate Recovery Codes
              </>
            )}
          </Button>
        </CardContent>
        {onClose && (
          <CardFooter>
            <Button variant="ghost" onClick={onClose} className="w-full">
              Cancel
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  // Display generated codes
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-green-100 rounded-full">
            <Shield className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <CardTitle>Your Recovery Codes</CardTitle>
        <CardDescription>Save these codes in a secure location</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning banner */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-800">Save these codes now!</p>
              <p className="text-xs text-red-700">
                You won't be able to see them again. Each code can only be used once.
              </p>
            </div>
          </div>
        </div>

        {/* Recovery codes grid */}
        <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          {formattedCodes.map(({ number, code }) => (
            <div
              key={code}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded"
            >
              <span className="text-xs text-gray-400 w-4">{number}.</span>
              <code className="text-sm font-mono text-gray-900">{code}</code>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopy} className="flex-1">
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleDownload} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        {/* Regenerate option */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Generate new codes
          </button>
          <p className="text-xs text-gray-400 mt-1">This will invalidate your current codes</p>
        </div>

        {/* Acknowledgment checkbox */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={e => setAcknowledged(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-tiffany focus:ring-tiffany"
          />
          <span className="text-sm text-gray-700">
            I have saved my recovery codes in a secure location
          </span>
        </label>
      </CardContent>
      <CardFooter>
        <Button onClick={onClose} disabled={!acknowledged} className="w-full">
          Done
        </Button>
      </CardFooter>
    </Card>
  );
}

export default RecoveryCodes;
